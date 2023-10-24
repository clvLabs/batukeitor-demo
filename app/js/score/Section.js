import {TimeSignature} from "./TimeSignature.js"
import {Track} from "./Track.js"

export class Section {
  constructor(id, ymlData, instrumentMgr) {
    this.DEFAULT_TIME_SIGNATURE = "4/4";
    this.METRONOME_INSTRUMENT_ID = "MT";

    this.id = id;

    if (ymlData.name)
      this.name = ymlData.name;
    else
      this.name = this.id;

    if (ymlData.color)
      this.color = ymlData.color;
    else
      this.color = "";

    if (this.color[0] == "#")
      this.color = this.color.substring(1);

    if (ymlData.timeSignature)
      this.timeSignature = new TimeSignature(ymlData.timeSignature);
    else
      this.timeSignature = new TimeSignature(this.DEFAULT_TIME_SIGNATURE);

    this.instrumentMgr = instrumentMgr;
    this.tracks = {};
    const _tmpLoadedTracks = new Set();
    var _tmpTracks = {};

    // Get max section length looking at all tracks
    var maxSectionLen = 0;
    for (const trackId in ymlData.tracks) {
      const ymlTrackNotes = ymlData.tracks[trackId];
      if (ymlTrackNotes.length > maxSectionLen)
        maxSectionLen = ymlTrackNotes.length;
    }

    // Add score tracks to temporary list keeping the order in instrumentMgr, fill blanks
    for (const instrumentId in this.instrumentMgr.all()) {

      // Skip metronome (not supposed to be in scores, added later)
      if (instrumentId == this.METRONOME_INSTRUMENT_ID)
        continue;

      var trackNotes;
      if (instrumentId in ymlData.tracks) {
        _tmpLoadedTracks.add(instrumentId)
        trackNotes = ymlData.tracks[instrumentId].padEnd(maxSectionLen, " ");
      } else {
        trackNotes = " ".padEnd(maxSectionLen, " ");
      }

      const instrument = this.instrumentMgr.get(instrumentId);
      _tmpTracks[instrumentId] = new Track(
        instrumentId,
        trackNotes,
        this.timeSignature,
        instrument);
    }

    // Calculate number of 16ths/Bars/Beats
    this.num16ths = 0;
    this.numBars = 0;
    this.numBeats = 0;

    Object.values(_tmpTracks).forEach(track => {
      if (track.num16ths > this.num16ths) {
        this.num16ths = track.num16ths;
        this.numBars = track.numBars;
        this.numBeats = track.numBeats;
      }
    });

    // Add metronome track to "definitive" list
    _tmpLoadedTracks.add(this.METRONOME_INSTRUMENT_ID)
    this.tracks[this.METRONOME_INSTRUMENT_ID] = new Track(
      this.METRONOME_INSTRUMENT_ID,
      this.timeSignature.getMetronomeBarDisplayStr().repeat(this.numBars),
      this.timeSignature,
      this.instrumentMgr.get(this.METRONOME_INSTRUMENT_ID));

    // Add rest of tracks to "definitive" list
    Object.values(_tmpTracks).forEach(track => {
      this.tracks[track.id] = track;
    });

    // Build loadedTracks list in the same order as instrumentMgr.all()
    this.loadedTracks = [];
    for (const instrumentId in this.instrumentMgr.all()) {
      if (_tmpLoadedTracks.has(instrumentId))
        this.loadedTracks.push(instrumentId);
    }
  }

  getMetronomeDisplayStr() {
    return this.timeSignature.getMetronomeBarDisplayStr().repeat(this.numBars);
  }

}
