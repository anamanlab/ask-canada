/**
 * The `cloudflare:workers` module, typed from cloudflare.config.ts.
 *
 * Cloudflare's own generator (`cf workers types`, https://developers.cloudflare.com/workers/languages/typescript/)
 * writes this to `.cloudflare/types/index.d.ts`, but it also adds the whole Workers runtime type set, whose
 * DOM-shaped globals (HTMLSelectElement, Element, …) collide with the `dom` lib this React app compiles
 * against. So instead of the generated file, this declaration derives the environment from the config at type
 * level — same `InferEnv` the generator uses, no artifact to keep in sync, no CI step to run it.
 *
 * The one gap: `InferEnv` maps the `ai` binding to the Workers `Ai` class, a runtime global that lives in the
 * same type set we leave out. It therefore types as `any` here, which only costs us a check on the binding we
 * pass straight to `createWorkersAI` (src/lib/ai/model.ts); the model it returns is fully typed.
 */
type CloudflareWorkerEnv = import('cf/config').InferEnv<
  import('cf/config').UnwrapConfig<
    import('cf/config').UnwrapConfig<typeof import('../../cloudflare.config').default>['worker']
  >
>;

declare module 'cloudflare:workers' {
  /** Bindings declared in cloudflare.config.ts. `undefined` off Workers: the Next.js build aliases the module. */
  export const env: CloudflareWorkerEnv;
}