import '../scss/options.scss'
import { Translate } from './translate'

new Translate() // eslint-disable-line no-new

function isURL (str) {
  // eslint-disable-next-line
  return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(str);
}

function message (text, className) {
  const msg = document.createElement('div')
  const msgContainer = document.querySelector('#msg')

  msg.className = className
  msg.innerText = text
  msg.addEventListener('transitionend', function () {
    msg.remove()
  })

  msgContainer.innerText = ''
  msgContainer.append(msg)

  setTimeout(function () {
    msg.style.transition = '0.8s'
    msg.style.opacity = 0
  }, 2000)
}

function storeSettings () {
  function getUrl () {
    const url = document.querySelector('#url')
    return url.value
  }

  function getToken () {
    const token = document.querySelector('#token')
    return token.value
  }

  function getPassword () {
    const password = document.querySelector('#password')
    return password.value
  }

  function getDropdown () {
    const dropdown = document.querySelector('#dropdown')
    return dropdown.checked
  }

  const url = getUrl()
  const token = getToken()
  const password = getPassword()
  const dropdown = getDropdown()

  if (isURL(url) && token !== '') {
    checkApi(url, token, password, dropdown)
  } else {
    message(browser.i18n.getMessage('savePreferences'), 'error')
  }
}

function updateUI (restoredSettings) {
  const url = document.querySelector('#url')
  url.value = restoredSettings.url || ''

  const token = document.querySelector('#token')
  token.value = restoredSettings.token || ''

  const password = document.querySelector('#password')
  password.value = restoredSettings.password || ''

  const dropdown = document.querySelector('#dropdown')
  dropdown.checked = restoredSettings.dropdown === true ? true : ''
}

function onError (e) {
  console.error(e)
}

function checkApi (url, token, password, dropdown) {
  return fetch(url + '/api.php', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'account/search',
      params: {
        authToken: token,
        text: ''
      },
      id: 1
    })
  }).then((resp) => resp.json())
    .then(function (resp) {
      fetch(url + '/api.php', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'account/viewPass',
          params: {
            authToken: token,
            tokenPass: password,
            id: resp.result.result[0].id
          },
          id: 1
        })
      })
        .then((resp) => resp.json())
        .then(function (resp) {
          if (resp.result.error) {
            message(browser.i18n.getMessage('notVerifiedPassword'), 'error')
          } else {
            browser.storage.local.set({
              url,
              token,
              password,
              dropdown
            })
            message(browser.i18n.getMessage('verifiedCredentials'), 'success')
          }
        }).catch(function (e) {
          message(browser.i18n.getMessage('notVerifiedPassword') + e.toString(), 'error')
        })
    })
    .catch(function (e) {
      message(browser.i18n.getMessage('apiKeyFailed'), 'error')
    })
}

const gettingStoredSettings = browser.storage.local.get()
gettingStoredSettings.then(updateUI, onError)

const saveButton = document.querySelector('#save-button')
saveButton.addEventListener('click', storeSettings)
