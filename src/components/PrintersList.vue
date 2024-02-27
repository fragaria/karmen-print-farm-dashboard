<template>

  <div v-if="printers?.length > 0" class="absolute top-16 left-0 right-0 bottom-8 grid auto-rows-auto">

    <div v-for="i in gridRows" :key="i" class="flex flex-row mt-8 mx-8">

      <div class="w-full grid gap-8"
        :class="{
          'grid-cols-1': gridCols == 1,
          'grid-cols-2': gridCols == 2,
          'grid-cols-3': gridCols == 3,
          'grid-cols-4': gridCols == 4,
          'grid-cols-5': gridCols == 5,
          'grid-cols-6': gridCols == 6,
          'grid-cols-7': gridCols == 7,
          'grid-cols-8': gridCols == 8,
          'grid-cols-9': gridCols == 9,
          'grid-cols-10': gridCols == 10,
          'grid-cols-11': gridCols == 11,
          'grid-cols-12': gridCols == 12
        }"
      >

        <div v-for="j in calculateColsCount(i)" :key="j"
          :set="printer = printers[(((i-1)*gridCols) + j) - 1]"
          class="flex flex-col border border-3 border-gray-400 shadow-lg"
        >
          <div class="bg-gray-200 relative">

            <!-- printer temperatures -->
            <div v-if="printer?.client?.octoprint?.printer?.temperature" class="absolute top-0 left-0">
              <div class="text-xs px-1 pt-1">
                <div class="bg-gray-400 text-white px-2 pt-1">
                  {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.actual?.toFixed(1) }}°C
                  / {{ printer?.client?.octoprint?.printer?.temperature?.tool0?.target?.toFixed(1) }}°C
                </div>
                <div class="bg-gray-400 text-white px-2 pb-1">
                  {{ printer?.client?.octoprint?.printer?.temperature?.bed?.actual?.toFixed(1) }}°C
                  / {{ printer?.client?.octoprint?.printer?.temperature?.bed?.target?.toFixed(1) }}°C
                </div>
              </div>
            </div>

            <!-- camera -->
            <div class="hidden lg:block">
              <img :ref="`cameraImageRef_${printer.id}`" src="/no-image.png" class="w-2/4 mx-auto" />
            </div>

            <!-- printer state -->
            <div class="text-xs lg:text-sm font-medium border-b border-gray-300">
              <div v-if="printer.stateId == 'PRINTING'" class="bg-blue-400 text-white p-1 text-center">{{ printer.state }}</div>
              <div v-else-if="printer.stateId == 'READY'" class="bg-green-500 text-white p-1 text-center">{{ printer.state }}</div>
              <div v-else-if="printer.stateId == 'DISCONNECTED'" class="bg-yellow-400 text-gray-900 px-2 p-1 text-center">{{ printer.state }}</div>
              <div v-else-if="['PAUSED', 'CANCELLING'].includes(printer.stateId)" class="bg-red-500 text-white p-1 text-center">{{ printer.state }}</div>
              <div v-else class="bg-gray-400 text-white p-1 text-center">{{ printer.state }}</div>
            </div>
          </div>

          <!-- progress -->
          <div v-if="printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) > 0
              && (printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(0) < 100 || printer.stateId == 'PRINTING')"
            class="text-sm font-medium bg-gray-100 border-b border-gray-300 relative"
          >
            <div class="bg-blue-200" :style="'width:' + printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) + '%'">
              <div>&nbsp;</div>
              <div class="absolute top-0 left-0 right-0 border border-1 border-blue-200 text-center">{{ printer?.client?.octoprint?.printer?.currentJob?.completion?.toFixed(2) }} %</div>
            </div>
          </div>

          <!-- printer name and printjob info -->
          <div class="">
            <div class="text-center font-medium pt-2 text-xs lg:text-base">{{ printer.name }}</div>
            <div class="text-center truncate text-sm px-4">{{ printer.note }}</div>
            <div
              v-if="printer?.printjobs?.results?.length > 0"
              class="flex flex-col text-xs px-4 mt-2 mb-2 gap-y-1 pt-2"
              :class="{'border-t border-gray-200': printer?.printjobs?.results?.length > 0}"
            >
              <div>{{ new Date(printer.printjobs.results[0].started_on).toLocaleString('cs-CZ') }}</div>
              <div class="break-all font-medium text-xs lg:text-base">{{ printer.printjobs.results[0].file_name }}</div>
              <div class="break-all">{{ printer.printjobs.results[0].username }}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

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
      isPolling: false,

      gridRows: 0,
      gridCols: 0
    }
  },

  methods: {
    async reload() {
      this.printers = []

      if (this.groupId) {
        this.printers = (await (await httpClient.authFetch(`groups/${this.groupId}/printers/`)).json())
          .filter((val) => {
            return val.enabled
          })
          .map((val) => {
            val.state = '...'
            return val
          })
      }

      // TODO: calculate number of rows/cols better
      let printersCount = this.printers.length      
      if (printersCount == 1) {
        this.gridRows = 1
        this.gridCols = 1
      } else if (printersCount <= 2) {
        this.gridRows = 1
        this.gridCols = 2
      } else if (printersCount <= 4) {
        this.gridRows = 2
        this.gridCols = 2
      } else if (printersCount <= 6) {
        this.gridRows = 2
        this.gridCols = 3
      } else if (printersCount <= 8) {
        this.gridRows = 2
        this.gridCols = 4
      } else if (printersCount == 9) {
        this.gridRows = 3
        this.gridCols = 3
      } else if (printersCount <= 10) {
        this.gridRows = 2
        this.gridCols = 5
      } else if (printersCount <= 12) {
        this.gridRows = 3
        this.gridCols = 4
      } else if (printersCount <= 14) {
        this.gridRows = 3
        this.gridCols = 5
      } else if (printersCount <= 16) {
        this.gridRows = 4
        this.gridCols = 4
      } else if (printersCount <= 18) {
        this.gridRows = 4
        this.gridCols = 5
      } else {
        this.gridRows = 5
        this.gridCols = 5
      }

      if (this.printers.length > 0) {
        this.polling()
      }
    },

    async polling() {
      if (! this.isPolling) {
        this.isPolling = true
        // TODO: don't poll when browser is not visible or browser tab is not active
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
      let ref = this.$refs[`cameraImageRef_${printer.id}`]
      if (ref) {
        if (['PRINTING', 'READY', 'PAUSED', 'CANCELLING', 'POWERED_OFF', 'DISCONNECTED'].includes(printer.stateId)) {
          const response = await httpClient.authFetch(`printers/${printer.id}/snapshot/`)
          if (response.status == 200) {
            ref[0].src = 'data:image/jpeg;base64,' + arrayBufferToBase64(await response.arrayBuffer())
          }
        }
        else {
          ref[0].src = '/no-image.png'
        }
      }
    },

    async pollPrintersJobs() {
      for (let printer of this.printers) {
        printer.printjobs = await (await httpClient.authFetch(`groups/${this.groupId}/print-jobs/?printer_id=${printer.id}`)).json()
      }
    },

    calculateColsCount(row) {
      let c = this.gridCols * row
      if (c > this.printers.length) {
        c = this.printers.length
      }
      return c - (this.gridCols * (row - 1))
    }
  }
}
</script>
