import { runCapacityExperiment, type SweepRequest } from './lab'
self.onmessage = (event: MessageEvent<SweepRequest>) => {
  try { const result = runCapacityExperiment(event.data, progress => self.postMessage({progress})); self.postMessage({result}) }
  catch(error) { self.postMessage({error:error instanceof Error ? error.message:String(error)}) }
}
