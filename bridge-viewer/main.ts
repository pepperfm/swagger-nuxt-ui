import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const app = createApp(App)

app.config.errorHandler = (error, instance, info) => {
  console.error('[bridge-viewer] Unhandled Vue error', {
    error,
    info,
    instance,
  })
}

window.addEventListener('error', (event) => {
  console.error('[bridge-viewer] Unhandled browser error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[bridge-viewer] Unhandled promise rejection', {
    reason: event.reason,
  })
})

app.use(ui, {
  router: false,
})

app.mount('#swagger-ui-bridge-viewer')
