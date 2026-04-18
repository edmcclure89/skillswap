import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables.')
}

// XHR-based fetch polyfill — works even when browser extensions
// intercept and break the native fetch API.
function xhrFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method || 'GET', url, true)
    const headers = options.headers || {}
    Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]))
    xhr.onload = () => {
      const responseHeaders = new Headers()
      xhr.getAllResponseHeaders().trim().split(/\r?\n/).forEach(line => {
        const parts = line.split(': ')
        if (parts.length >= 2) responseHeaders.append(parts[0], parts.slice(1).join(': '))
      })
      resolve(new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: responseHeaders
      }))
    }
    xhr.onerror = () => reject(new TypeError('Network request failed'))
    xhr.ontimeout = () => reject(new TypeError('Network request timed out'))
    xhr.send(options.body || null)
  })
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: xhrFetch }
})
