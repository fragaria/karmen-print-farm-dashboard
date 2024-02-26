<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">State</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last printjob</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="printer in printers" :key="printer.id">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{{ printer.name }}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div>
                    <span v-if="printer.stateId == 'PRINTING'"
                      class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-blue-400 text-white">{{ printer.state }}</span>
                    <span v-else-if="printer.stateId == 'READY'"
                      class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-green-500 text-white">{{ printer.state }}</span>
                    <span v-else-if="printer.stateId == 'DISCONNECTED'"
                      class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-yellow-400 text-gray-900">{{ printer.state }}</span>
                    <span v-else-if="['PAUSED', 'CANCELLING'].includes(printer.stateId)"
                      class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-red-500 text-white">{{ printer.state }}</span>
                    <span v-else
                      class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600">{{ printer.state }}</span>
                  </div>
                  <div v-if="printer?.client?.octoprint?.printer?.temperature" class="pt-2">
                    <div>Tool: {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.actual?.toFixed(1) }}°C / {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.target?.toFixed(1) }}°C</div>
                    <div>Bed: {{ printer?.client?.octoprint?.printer?.temperature?.bed?.actual?.toFixed(1) }}°C / {{ printer?.client?.octoprint?.printer?.temperature?.bed?.target?.toFixed(1) }}°C</div>
                    <div>Progress: {{ printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) }}%</div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ printer.note }}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div v-if="!printer?.printjobs">...</div>
                  <div v-else-if="printer?.printjobs?.results?.length > 0">
                    <div>{{ printer.printjobs.results[0].started_on }}</div>
                    <div>{{ printer.printjobs.results[0].file_name }}</div>
                    <div>{{ printer.printjobs.results[0].username }}</div>
                  </div>
                  <div v-else>no print history</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import httpClient from '@/httpClient.js'

export default {
  props: {
    groupId: String
  },

  watch: {
    groupId() {
      this.reload()
    }
  },

  data() {
    return {
      printers: [],
      isPolling: false
    }
  },

  methods: {
    async reload() {
      if (this.groupId) {
        this.printers = (await (await httpClient.authFetch(`groups/${this.groupId}/printers/`)).json()).map((val) => {
          val.state = '...'
          return val
        })
      } else {
        this.printers = []
      }

      await this.pollPrintersState()
      await this.pollPrintersJobs()

      this.polling()
    },

    async polling() {
      if (! this.isPolling) {
        this.isPolling = true
        while (true) {
          await this.pollPrintersState()
          await this.pollPrintersJobs()
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    },

    async pollPrintersState() {
      for (let printer of this.printers) {
        const data = await (await httpClient.authFetch(`printers/${printer.id}/?fields=client`)).json()

        let state = 'unknown'
        let stateId = null

        if (data?.client?.octoprint?.error?.code == 'moved-to-background') {
          // no new data received, keep previous state
          state = printer.state
          stateId = printer.stateId
        } else if (data?.client?.octoprint?.error?.code == 'device-not-connected-to-proxy-server') {
          state = 'Offline'
          stateId = 'OFFLINE'
        } else if (data?.client?.octoprint?.error?.code == 'printer-turned-off') {
          state = 'Printer is turned off'
          stateId = 'POWERED_OFF'
        } else if (data?.client?.octoprint?.printer?.state?.flags?.operational) {
          if (data?.client?.octoprint?.printer?.state?.flags?.cancelling) {
            state = 'Cancelling print';
            stateId = 'CANCELLING'
          } else if (data?.client?.octoprint?.printer?.state?.flags?.printing) {
            state = 'Printing';
            stateId = 'PRINTING'
          } else if (data?.client?.octoprint?.printer?.state?.flags?.paused) {
            state = 'Paused';
            stateId = 'PAUSED'
          } else {
            state = 'Ready to print';
            stateId = 'READY'
          }
        } else if (!data?.client?.octoprint?.printer?.state) {
          state = 'Not paired'
          stateId = 'DISCONNECTED'
        }

        printer.state = state
        printer.stateId = stateId

        if (data?.client?.octoprint?.error?.code != 'moved-to-background') {
          printer.client = data.client
        }
      }
    },

    async pollPrintersJobs() {
      for (let printer of this.printers) {
        printer.printjobs = await (await httpClient.authFetch(`groups/${this.groupId}/print-jobs/?printer_id=${printer.id}`)).json()
      }
    }
  }
}
</script>
