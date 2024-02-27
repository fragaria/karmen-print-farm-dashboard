let API_URL_PREFIX = 'https://preprod1.next.karmen.tech/api/2/'
let API_TOKEN = null

export default {
  authFetch: function (url, headers = {}) {
    headers['Authorization'] = `Token ${API_TOKEN}`
    return fetch(
      `${API_URL_PREFIX}${url}`,
      { headers: headers },
    )
  },

  getConfig: function () {
    return {
      API_URL_PREFIX: API_URL_PREFIX,
      API_TOKEN: API_TOKEN
    }
  },

  setConfig: function (url_prefix, token) {
    API_URL_PREFIX = url_prefix
    API_TOKEN = token
  }
}
