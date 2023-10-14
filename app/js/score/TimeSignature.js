
export class TimeSignature {
  constructor(signature) {
    // const ACCEPTED_SIGNATURES = [
    //   "2/4", "3/4", "4/4", "6/8", "9/8" "12/8"
    // ];
    // if (!ACCEPTED_SIGNATURES.includes(signature)) {
    //   ERROR !!!!
    // }

    this.name = signature;

    const sigParts = signature.split("/");
    this.upperNum = parseInt(sigParts[0]);
    this.lowerNum = parseInt(sigParts[1]);

    this.numBeats = this.upperNum;
    this.beatNote = this.lowerNum;

    if (this.isCompound())
      this.numBeats /= 3;

    if (this.beatNote == 4) {
      this.num16thsPerBar = this.upperNum * 4;
    }
    else if (this.beatNote == 8) {
      this.num16thsPerBar = this.upperNum * 2;
    }
  }

  normalizeNum16ths(num16ths) {
    return this.getNumBars(num16ths) * this.num16thsPerBar;
  }

  getNumBars(num16ths) {
    return Math.ceil(num16ths / this.num16thsPerBar);
  }

  getTrackNumBars(track) {
    return this.getNumBars(track.num16ths);
  }

  getSectionNumBars(section) {
    var max16ths = 0;

    for (const _trackId in section.tracks) {
      const _track = section.tracks[trackId];
      if (_track.num16ths > max16ths)
        max16ths = _track.num16ths;
    }

    return this.getNumBars(max16ths);
  }

  isBarStart(pos) {
    return (pos % this.num16thsPerBar) == 0;
  }

  isBeatStart(pos) {
    if (this.beatNote == 4) {
      return (pos % 4) == 0;
    }
    else if (this.beatNote == 8) {
      return (pos % 6) == 0;
    }
  }

  isEighthNoteStart(pos) {
    return (pos % 2) == 0;
  }

  isCompound() {
    return (this.upperNum % 3) == 0;
  }

  getMetronomeBarDisplayStr() {
    switch (this.name) {
      case "2/4":  return "1   2   ";
      case "3/4":  return "1   2   3   ";
      case "4/4":  return "1   2   3   4   ";
      case "6/8":  return "1     2     ";
      case "9/8":  return "1     2     3     ";
      case "12/8": return "1     2     3     4     ";
      default: return `ERROR: Unknown time signature (${this.name})`;
    }
  }

}
