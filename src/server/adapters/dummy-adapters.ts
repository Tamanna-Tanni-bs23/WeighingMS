import type { DummyPrinter, DummyScales } from '../dummy/devices.js';
import type { DummyOrgatex } from '../dummy/orgatex.js';
import type { OrgatexPort, PrinterPort, ScalePort } from '../ports.js';

// Training adapters: in-process calls into the Dummy services. Swap these for HTTP/serial adapters
// when the real OrgaTEX interface and device protocols are known.

export const dummyOrgatexAdapter = (otx: DummyOrgatex): OrgatexPort => ({
  listBatches: async () => otx.listBatches(),
  getBatch: async (id) => otx.getBatch(id),
  getRecipe: async (id) => otx.getRecipe(id),
  postConsumption: async (post) => otx.postConsumption(post),
});

export const dummyScaleAdapter = (scales: DummyScales): ScalePort => ({
  info: async (id) => scales.info(id),
  read: async (id) => scales.read(id),
  tare: async (id) => scales.tare(id),
});

export const dummyPrinterAdapter = (printer: DummyPrinter): PrinterPort => ({
  print: async (ticket) => printer.print(ticket),
});
