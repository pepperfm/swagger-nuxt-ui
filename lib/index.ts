import type { App, Plugin } from 'vue'
import SwaggerViewer from './components/SwaggerViewer.vue'
import './styles/swagger-ui.css'

export { default as ContentNavigation } from './components/ContentNavigation.vue'
export { default as RequestBodyCard } from './components/RequestBodyCard.vue'
export { default as RequestParametersList } from './components/RequestParametersList.vue'
export { default as ResponseExampleCard } from './components/ResponseExampleCard.vue'
export { default as SchemaDetailCard } from './components/SchemaDetailCard.vue'
export { default as SwaggerViewer } from './components/SwaggerViewer.vue'

export { generateExampleFromSchema } from './composables/schemaExample'
export { useCopy } from './composables/useCopy'
export { useSelectedOperation } from './composables/useSelectedOperation'
export { useSwaggerNavigation } from './composables/useSwaggerNavigation'
export { useSwaggerSchema } from './composables/useSwaggerSchema'

export type {
  EndpointSelection,
  HttpMethod,
  IApiSpec,
  IMethod,
  INavigationGroup,
  INavigationItem,
  IParameter,
  OpenApiComponents,
  OpenApiSchemaObject,
  OpenApiSecurityScheme,
  ResponseExample,
  SchemaSelection,
  SelectedItem,
} from './types'

export function createSwaggerUiPlugin(): Plugin {
  return {
    install(app: App) {
      app.component('SwaggerViewer', SwaggerViewer)
    },
  }
}
