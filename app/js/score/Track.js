
export class Track {
  constructor(id, notes, timeSignature, instrument) {
    this.id = id;
    this.timeSignature = timeSignature;
    this.instrument = instrument;

    if (notes.trimEnd() == "")
      notes = "";

    this.num16ths = timeSignature.normalizeNum16ths(notes.length);
    this.length = this.num16ths;  // alias!
    this.notesStr = notes.padEnd(this.num16ths, " ");

    this.samples = [];
    for (const index in this.notesStr) {
      const sampleId = this.notesStr[index];
      this.samples.push( instrument.samples[sampleId] );
    }

    this.numBars = timeSignature.getNumBars(this.num16ths);
    this.numBeats = this.numBars * timeSignature.numBeats;
  }
}
