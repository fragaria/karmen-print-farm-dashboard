<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">

    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-10 w-auto" src="/src/assets/logo.svg" alt="Karmen.tech" />
      <h1 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Karmen Print Farm Dashboard</h1>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="space-y-6">
        <div>
          <label for="apiUrlPrefix" class="block text-sm font-medium leading-6 text-gray-900">API URL prefix</label>
          <div class="mt-2">
            <input v-model="apiUrlPrefix" id="apiUrlPrefix" name="apiUrlPrefix" type="text" required="" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          </div>
        </div>
        <div>
          <label for="apiUrlToken" class="block text-sm font-medium leading-6 text-gray-900">API token</label>
          <div class="mt-2">
            <input v-model="apiUrlToken" id="apiUrlToken" name="apiUrlToken" type="text" required="" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          </div>
        </div>

        <div>
          <button @click.stop="save()" type="button" class="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">Save</button>
        </div>
      </div>
    </div>

  </div>
</template>
  
<script>
import httpClient from '@/httpClient.js'

export default {
  components: {
  },

  emits: [
    'save'
  ],

  data: () => ({
    apiUrlPrefix: null,
    apiUrlToken: null
  }),

  created: function() {
    this.apiUrlPrefix = httpClient.getConfig().API_URL_PREFIX
    this.apiUrlToken = httpClient.getConfig().API_TOKEN
  },

  methods: {
    save() {
      httpClient.setConfig(this.apiUrlPrefix, this.apiUrlToken)
      this.$emit('save')
    }
  }
}
</script>
