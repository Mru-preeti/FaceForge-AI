const ATTRIBUTE_RULES = [
  {
    key: 'Brown_Hair',
    label: 'brown hair',
    positive: [/\b(?:brown\s+hair|brown\s+haired|brunette)\b/],
    negative: [/\b(?:not\s+(?:having\s+)?brown\s+hair|without\s+brown\s+hair|no\s+brown\s+hair|not\s+brunette)\b/],
  },
  {
    key: 'Black_Hair',
    label: 'black hair',
    positive: [/\b(?:black\s+hair|black\s+haired)\b/],
    negative: [/\b(?:not\s+(?:having\s+)?black\s+hair|without\s+black\s+hair|no\s+black\s+hair)\b/],
  },
  {
    key: 'Blond_Hair',
    label: 'blond hair',
    positive: [/\b(?:blond(?:e)?(?:\s+hair|\s+haired)?)\b/],
    negative: [/\b(?:not\s+blond(?:e)?(?:\s+hair)?|without\s+blond(?:e)?\s+hair|no\s+blond(?:e)?\s+hair)\b/],
  },
  {
    key: 'Gray_Hair',
    label: 'gray hair',
    positive: [/\b(?:gr[ae]y\s+hair|gr[ae]y\s+haired)\b/],
    negative: [/\b(?:not\s+(?:gr[ae]y\s+hair|gr[ae]y\s+haired)|without\s+gr[ae]y\s+hair|no\s+gr[ae]y\s+hair)\b/],
  },
  {
    key: 'Smiling',
    label: 'smiling',
    positive: [/\b(?:smiling|smile|smiles)\b/],
    negative: [/\b(?:not\s+(?:smiling|smile|smiles)|unsmiling|without\s+(?:a\s+)?smile|no\s+smile)\b/],
  },
  {
    key: 'Eyeglasses',
    label: 'eyeglasses',
    positive: [/\b(?:eyeglasses|glasses|spectacles)\b/],
    negative: [/\b(?:no\s+(?:eye)?glasses|without\s+(?:wearing\s+)?(?:eye)?glasses|not\s+(?:wearing\s+)?(?:eye)?glasses|no\s+spectacles|without\s+spectacles|not\s+(?:wearing\s+)?spectacles)\b/],
  },
  {
    key: 'Wearing_Hat',
    label: 'wearing a hat',
    positive: [/\b(?:hat|cap)\b/],
    negative: [/\b(?:no\s+(?:hat|cap)|without\s+(?:(?:wearing|having)\s+)?(?:a\s+)?(?:hat|cap)|not\s+(?:wearing\s+)?(?:a\s+)?(?:hat|cap))\b/],
  },
  {
    key: 'Heavy_Makeup',
    label: 'heavy makeup',
    positive: [/\bheavy\s+(?:makeup|make\s+up)\b/],
    negative: [/\b(?:not\s+heavy\s+(?:makeup|make\s+up)|without\s+(?:heavy\s+)?(?:makeup|make\s+up)|no\s+(?:heavy\s+)?(?:makeup|make\s+up))\b/],
  },
]

const UNSUPPORTED_DESCRIPTORS = [
  { pattern: /\b(?:red|auburn|ginger|pink|purple|blue|green|silver|white)\s+(?:colored\s+)?hair\b/, label: 'unsupported hair color' },
  { pattern: /\b(?:curly|straight|wavy|coily|frizzy|long|short|braided|shaved|bald)(?:\s+\w+){0,3}\s+hair\b|\b(?:curly|straight|wavy|coily|frizzy|long|short|braided|shaved|bald)[ -]?haired\b/, label: 'unsupported hair texture or length' },
  { pattern: /\b(?:blue|green|brown|hazel|amber|dark|light)\s+eyes?\b/, label: 'eye color' },
  { pattern: /\b(?:beard|mustache|moustache|facial hair|sideburns)\b/, label: 'facial hair' },
  { pattern: /\b(?:frowning|laughing|crying|angry|sad|surprised|neutral expression)\b/, label: 'facial expression' },
  { pattern: /\b(?:young|old|elderly|teenager|teenage|child|middle aged|adult|male|man|boy)\b/, label: 'age or gender' },
  { pattern: /\b(?:light|subtle|natural|soft|bold|dramatic)\s+make\s*up\b/, label: 'makeup style other than heavy makeup' },
  { pattern: /\b(?:earrings|necklace|piercing|tattoo|scarf)\b/, label: 'accessory or other appearance attribute' },
]

export class PromptValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PromptValidationError'
    this.status = 422
  }
}

function includesPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

export function parsePromptAttributes(prompt) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new PromptValidationError('Prompt must be a non-empty string.')
  }

  const normalizedPrompt = prompt.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ')

  for (const descriptor of UNSUPPORTED_DESCRIPTORS) {
    if (descriptor.pattern.test(normalizedPrompt)) {
      throw new PromptValidationError(`Unsupported attribute description: ${descriptor.label}.`)
    }
  }

  const attributes = Object.fromEntries(ATTRIBUTE_RULES.map(({ key }) => [key, 2]))

  for (const rule of ATTRIBUTE_RULES) {
    const isNegative = includesPattern(normalizedPrompt, rule.negative)
    const positiveSearchText = rule.negative.reduce(
      (text, pattern) => text.replace(new RegExp(pattern.source, 'g'), ' '),
      normalizedPrompt,
    )
    const isPositive = includesPattern(positiveSearchText, rule.positive)

    if (isNegative && isPositive) {
      throw new PromptValidationError(`Conflicting descriptions for ${rule.label}.`)
    }

    if (isNegative) attributes[rule.key] = 0
    if (isPositive) attributes[rule.key] = 1
  }

  const positiveHairColors = ATTRIBUTE_RULES
    .filter(({ key }) => ['Brown_Hair', 'Black_Hair', 'Blond_Hair', 'Gray_Hair'].includes(key))
    .filter(({ key }) => attributes[key] === 1)

  if (positiveHairColors.length > 1) {
    throw new PromptValidationError(
      `Conflicting hair colors: ${positiveHairColors.map(({ label }) => label).join(', ')}.`,
    )
  }

  if (Object.values(attributes).every((value) => value === 2)) {
    throw new PromptValidationError('Prompt must describe at least one supported attribute.')
  }

  return attributes
}