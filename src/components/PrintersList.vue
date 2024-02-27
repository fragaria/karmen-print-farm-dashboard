<template>

  <ul v-if="printers?.length > 0" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
    <li v-for="printer in printers" :key="printer.id" class="col-span-1 flex flex-col divide-y divide-gray-200 pb-2 rounded-lg bg-white text-center shadow-lg border border-1 border-gray-300">
      <div class="flex flex-1 flex-col">
        <div class="text-sm font-medium border-b border-gray-300">
          <div v-if="printer.stateId == 'PRINTING'" class="bg-blue-400 text-white px-2 py-1 rounded-t-lg">{{ printer.state }}</div>
          <div v-else-if="printer.stateId == 'READY'" class="bg-green-500 text-white px-2 py-1 rounded-t-lg">{{ printer.state }}</div>
          <div v-else-if="printer.stateId == 'DISCONNECTED'" class="bg-yellow-400 text-gray-900 px-2 py-1 rounded-t-lg">{{ printer.state }}</div>
          <div v-else-if="['PAUSED', 'CANCELLING'].includes(printer.stateId)" class="bg-red-500 text-white px-2 py-1 rounded-t-lg">{{ printer.state }}</div>
          <div v-else class="bg-gray-100 text-gray-600 px-2 py-1 rounded-t-lg">{{ printer.state }}</div>
        </div>
        <img :ref="`cameraImageRef_${printer.id}`" class="h-auto w-full flex-shrink-0" src="/no-image.png" />
        <div v-if="printer?.client?.octoprint?.printer?.temperature" class="grid grid-cols-2 text-xs px-1 pt-1 bg-gray-100">
          <div class="text-start">
            {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.actual?.toFixed(1) }}°C
            / {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.target?.toFixed(1) }}°C
          </div>
          <div class="text-end">
            {{ printer?.client?.octoprint?.printer?.temperature?.bed?.actual?.toFixed(1) }}°C
            / {{ printer?.client?.octoprint?.printer?.temperature?.bed?.target?.toFixed(1) }}°C
          </div>
        </div>
        <div v-if="printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) > 0
            && (printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(0) < 100 || printer.stateId == 'PRINTING')"
          class="text-sm font-medium bg-gray-100 border-b border-gray-300 relative"
        >
          <div class="bg-blue-200" :style="'width:' + printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) + '%'">
            <div>&nbsp;</div>
            <div class="absolute top-0 left-0 right-0 border border-1 border-blue-200">{{ printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) }} %</div>
          </div>
        </div>
        <h3 class="mt-2 text-base font-medium text-gray-900">{{ printer.name }}</h3>
        <div v-if="printer.note" class="text-sm text-gray-500 truncate px-4">{{ printer.note }}</div>
        <dl
          v-if="printer?.printjobs?.results?.length > 0"
          class="flex flex-col text-xs px-4 mt-2 mb-2 gap-y-1 pt-2"
          :class="{'border-t border-gray-200': printer?.printjobs?.results?.length > 0}"
        >
          <dd>{{ new Date(printer.printjobs.results[0].started_on).toLocaleString('cs-CZ') }}</dd>
          <dd class="break-all text-base font-medium">{{ printer.printjobs.results[0].file_name }}</dd>
          <dd class="break-all">{{ printer.printjobs.results[0].username }}</dd>
        </dl>
      </div>
    </li>
  </ul>

  <div v-else class="mt-8">There are no printers in selected workspace.</div>

</template>

<script>
import arrayBufferToBase64 from '@/arrayBufferToBase64'
import httpClient from '@/httpClient.js'

export default {
  components: {
  },

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
        this.printers = (await (await httpClient.authFetch(`groups/${this.groupId}/printers/`)).json())
          .filter((val) => {
            return val.enabled
          })
          .map((val) => {
            val.state = '...'
            return val
          })
      } else {
        this.printers = []
      }

      if (this.printers.length > 0) {
        this.polling()
      }
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

        this.pollPrinterCamera(printer)
      }
    },

    async pollPrinterCamera(printer) {
      let ref = this.$refs[`cameraImageRef_${printer.id}`][0]
      if (['PRINTING', 'READY', 'PAUSED', 'CANCELLING', 'POWERED_OFF', 'DISCONNECTED'].includes(printer.stateId)) {
        const response = await httpClient.authFetch(`printers/${printer.id}/snapshot/`)
        if (response.status == 200) {
          ref.src = 'data:image/jpeg;base64,' + arrayBufferToBase64(await response.arrayBuffer())
        }
      }
      else {
        ref.src = '/no-image.png'
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
