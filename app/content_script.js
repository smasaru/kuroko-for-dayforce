const _MODNAME = "[Kuroko]";

const _MODE = {
    ZZ_Any: {
        id: "ZZ_Any",
        name: "ZZ any",
        match: /\.com\/agent\//        
    },
    Dayforce_MyDayforce: {
        id: "Dayforce_MyDayforce",
        name: "MyDayforce",
        match: /dayforcehcm\.com\/MyDayforce\//        
    },
}
const _UNSUPPORTED_MODE = "Unsupported Mode";

const checkMode = () => {
    const url = location.href;

    let mode = Object.keys(_MODE).find(key => {
        return url.match(_MODE[key].match);
    });

    if(undefined == mode) {
        return _UNSUPPORTED_MODE;
    }
    return mode;
}

const _PMSG = PopupMsg.getInstance();
const _UTILS = new Utils(_MODNAME);

////////////////////////////
////////////////////////////
////////////////////////////

console.log(`${_MODNAME} Kuroko wakes up early.`);

let _runtimeCO = {};
loadConfigOptions().then( async(__configOption) => {
    console.log(`${_MODNAME} Config options`, __configOption);
    _runtimeCO = __configOption;

    // Main procedure
    let mode = checkMode();
    console.log(`${_MODNAME} Working on ${mode} mode.`);

    switch(mode) {
        case _MODE.Dayforce_MyDayforce.id:
            const _DAYFORCE = new Dayforce(_MODNAME, _UTILS, _runtimeCO);
            _DAYFORCE.monitorDayforcePages();

            break;
        case _MODE.ZZ_Any.id:
            if(true) {
                return;
            }
            _UTILS.addListenerOfTabClosure();
            break;
        default:
            console.log(`${_MODNAME} No action is defined: ${mode}`);
    }
});
