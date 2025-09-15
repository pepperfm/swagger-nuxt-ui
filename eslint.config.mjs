import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  rules: {
    'unicorn/error-message': 'off',

    // Всегда фигурные
    'curly': ['error', 'all'],

    // 1TBS + запрет однострочных блоков { ... }
    '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],

    '@stylistic/object-curly-spacing': ['error', 'always'],

    '@stylistic/object-curly-newline': ['error', {
      ObjectExpression: { minProperties: 5, multiline: true, consistent: true },
      ObjectPattern: { minProperties: 5, multiline: true, consistent: true },
      ImportDeclaration: { minProperties: 5, multiline: true, consistent: true },
      ExportDeclaration: { minProperties: 5, multiline: true, consistent: true },
    }],

    // Если атрибутов (props) ≤ 2 — можно в одну строку.
    // Если > 2 — переносим на новые строки, по одному на строку.
    'vue/max-attributes-per-line': ['error', {
      singleline: 2,
      multiline: { max: 1 },
    }],

    // (опционально) аккуратная вертикальная выравниловка и отступы
    'vue/html-indent': ['error', 2, {
      baseIndent: 1,
      attribute: 1,
      closeBracket: 0,
      alignAttributesVertically: true,
    }],

    'antfu/if-newline': 'off',
  },
})
