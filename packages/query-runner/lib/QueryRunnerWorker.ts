import type { IBatchedRequest, IBatchedResult } from './QueryRunnerTypes';
import { type IBindings, SparqlEndpointFetcher } from 'fetch-sparql-endpoint';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const endpointFetcher = new SparqlEndpointFetcher({
  directPost: true,
  forceGetIfUrlLengthBelow: 0,
  method: 'POST'
});

const queryBindings = (endpoint: string, query: string): Promise<IBindings[]> => new Promise((resolve, reject) => {
  const bindings: IBindings[] = [];
  endpointFetcher.fetchBindings(endpoint, query).then(bindingsStream => bindingsStream
    .on('data', (data: IBindings) => bindings.push(data))
    .on('end', () => resolve(bindings))
    .on('error', reject));
});

addEventListener('message', async (event: MessageEvent<Uint8Array>): Promise<void> => {
  const messageString = textDecoder.decode(event.data);
  const message: IBatchedRequest = JSON.parse(messageString);
  const bindings = await queryBindings(message.endpoint, message.query);
  const result: IBatchedResult = { batch: message.batch, bindings, type: message.type };
  const resultString = JSON.stringify(result);
  const resultBuffer = textEncoder.encode(resultString);
  postMessage(resultBuffer, [resultBuffer.buffer]);
});
