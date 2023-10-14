import {BatukeitorApp} from "./BatukeitorApp.js"

window.addEventListener("DOMContentLoaded", () => {
  $("#loading").hide();

  const app = new BatukeitorApp();
  app.run();
});
