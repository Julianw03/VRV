declare global {
  type JsonNode =
    | string
    | number
    | boolean
    | null
    | JsonNode[]
    | { [key: string]: JsonNode };
}

export {};