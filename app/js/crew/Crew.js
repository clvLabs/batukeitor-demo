
export class Crew {
  constructor(crewId, ymlData) {
    this.id = crewId;
    var _ymlCrewData = jsyaml.load(ymlData);
    this.name = _ymlCrewData.name;
    this.scores = _ymlCrewData.scores;

    if (_ymlCrewData.instrumentPack)
      this.instrumentPack = _ymlCrewData.instrumentPack;
    else
      this.instrumentPack = "default";
  }
}
