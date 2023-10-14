
export class CrewManager extends EventTarget {
  constructor() {
    super();
    this.BASE_URL = "./data/crews";
    this._list = {}
    this._loadPendingCrews = [];
    this.selectedCrew = undefined;
    this.defaultCrewId = undefined;
  }

  init() {
    const self = this;
    $.get(this._getCrewListURL()).done(function(data) {
      try {
        self._parseCrewList(data);
      } catch (error) {
        self._error(`[Crews] ERROR processing crews list file: ${error}`);
      }
    }).fail(function() {
      self._error(`[Crews] ERROR loading crew list: ${url}`);
    });
  }

  all() {
    return this._list;
  }

  get(crewId) {
    return this._list[crewId];
  }

  getDefaultCrewId() {
    return this.defaultCrewId;
  }

  select(crewId) {
    this.selectedCrew = this._list[crewId];
  }

  _error(msg) {
    this.dispatchEvent(new CustomEvent('error',
      {detail: { error: msg }}));
  }

  _parseCrewList(ymlData) {
    var _ymlCrewList;
    try {
      _ymlCrewList = jsyaml.load(ymlData);
    } catch (error) {
      this._error(`[Crews] ERROR: Invalid data in crews list file: ${error}`);
      return;
    }

    this.loaded = true;

    this.defaultCrewId = _ymlCrewList.defaultCrew;

    for (const crewId of _ymlCrewList.crews)
    {
      this._loadPendingCrews.push(crewId);

      const self = this;
      $.get(this._getCrewDataURL(crewId)).done(function(data) {
        try {
          self._parseCrewData(crewId, data);
        } catch (error) {
          self._error(`[Crews] ERROR processing crew [${crewId}] data file: ${error}`);
        }
      }).fail(function() {
        self._error(`[Crews] ERROR loading crew data: ${url}`);
      }).always(function() {
        self._loadPendingCrews = self._loadPendingCrews.filter(id => id != crewId);

        if (self._loadPendingCrews.length == 0)
          self.dispatchEvent(new Event('ready'));
      });
    }
  }

  _parseCrewData(crewId, ymlData) {
    var _ymlCrewData;
    try {
      _ymlCrewData = jsyaml.load(ymlData);
    } catch (error) {
      this._error(`[Crews] ERROR: Invalid data in crew [${crewId}] data file: ${error}`);
      return;
    }

    this._list[crewId] = {
      id: crewId,
      name: _ymlCrewData.name,
      scores: _ymlCrewData.scores,
    };
  }

  _getCrewListURL() {
    return `${this.BASE_URL}/index.yml?ts=${Date.now()}`;
  }

  _getCrewDataURL(crewId) {
    return `${this.BASE_URL}/${crewId}/index.yml?ts=${Date.now()}`;
  }

}
