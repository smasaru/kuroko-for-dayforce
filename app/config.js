const _DAY = Object.freeze({
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday"
});

const _CONFIG = {
    DF__DEFAULT_WORKING_DAY: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    DF__WORK_ON_A_HOLIDAY: false,
    DF__DEFAULT_WORKING_TIME: [
        { start: 9, end: 12 },
        { start: 13, end: 18 },
    ],
    DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME: [{ start: 9, end: 13 }],
    DF__OVERRIDE_WORKING_DAY_TIME: [],
     // Default: [] / Sample: [{day:"Mon", time:[{start: 8, end: 11}, {start: 12, end: 17}]}] DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME: [] // Default: [{start:9, end: 13}]
}

const localStorage = {
  get(keys) {
    return new Promise((resolve, rejected) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local?.get) {
        chrome.storage.local.get(keys, resolve);
      } else {
        console.log(`Failed to get data to localstorage`, keys);
        rejected();
      }
    });
  },
  set(items) {
    return new Promise((resolve, rejected) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local?.set) {
        chrome.storage.local.set(items, resolve);
      } else {
        console.log(`Failed to set data to localstorage`, items);
        rejected();
      }
    });
  },
};

const loadConfigOptions = async () => {
    console.log(`[Kuroko] Config> loadConfigOptions() is called`);
    const features = Object.keys(_CONFIG);
    let savedFF = await chrome.storage.local.get(features);
    let ff = {};
    for(let key of Object.keys(_CONFIG)) {
        if(key in savedFF) {
            ff[key] = savedFF[key];
        } else {
            ff[key] = _CONFIG[key];            
        }
    }
    return ff;
}

const getConfigName = (__key) => {
    if(__key in _CONFIG) {
        return _CONFIG[__key].name;
    } else {
        return `No such feature exists with key "${__key}"`
    }
}