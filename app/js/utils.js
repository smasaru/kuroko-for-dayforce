class Utils {
    #COPY_ICON = chrome.runtime.getURL("image/icons8-copy-96.png");
    #MODNAME = "Utils>";
    #LOGHEADER = this.#MODNAME;
    #DATE_OPTIONS = {        
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
    };

    #observerCount = 1;

    get LOG() {
        return this.#LOGHEADER;
    }

    constructor(__parentMod) {
        this.#LOGHEADER = __parentMod + this.#LOGHEADER;
    }

    // Insert Action on element inserted
    ///// This logic is from https://davidwalsh.name/detect-node-insertion
    #getUniqueKey = () => {
        return "elmObserver-"+parseInt(Math.random()*1000)+"-"+this.#observerCount++;
    }

    invokeMethodOnInsert = (__query, __callback) => {
        let uniqueKey = this.#getUniqueKey();
        const observerCss = `
            @keyframes ${uniqueKey} {
                from { opacity: 0.99; }
                to { opacity: 1; }
            }
            ${__query} {
                animation-duration: 0.001s;
                animation-name: ${uniqueKey};
            }
         `;
        this.insertCss(observerCss);

        console.log(`${this.LOG} invokeMethodOnInsert() added for ${__query} with ${uniqueKey}`);
        document.addEventListener("webkitAnimationStart", (event) => {
            if (event.animationName == uniqueKey) __callback(event);
        }, false);
    }

    waitData(__baseElem, __selectorStr, __targetValueRegEx, __intervalInMilliSec, __waitTimeoutInMilliSec) {
        if(__intervalInMilliSec == undefined) {
            __intervalInMilliSec = 500; // 0.5 sec
        }
        if(__waitTimeoutInMilliSec == undefined) {
            __waitTimeoutInMilliSec = 10000; // 10 seconds
        }
        const _MAX_WAIT_COUNT = __waitTimeoutInMilliSec / __intervalInMilliSec;
        let _trialCounter = 0;

        return new Promise((resolve,reject)=>{
            let loopId = setInterval(function() {
                let elm = __baseElem.querySelector(__selectorStr);   
                if(elm != null && __targetValueRegEx.test( elm.innerText ) ) {
                    console.log(`${this.LOG} waitData() baseElem.querySelector('${__selectorStr}') got the targetValue! ${elm.innerText}`);
                    clearInterval(loopId);
                    resolve(elm);
                }

                _trialCounter++;
                if(_trialCounter>_MAX_WAIT_COUNT) {
                    console.warn(`${this.LOG} waitData() baseElem.querySelector('${__selectorStr}') failed to get the targetValue until expires. ${__waitTimeoutInMilliSec} ms.` );
                    clearInterval(loopId);
                    reject(null);
                }
            },__intervalInMilliSec);
        });
    }

    insertCss = (_css) => {
        let style = document.createElement('style');
        if (style.styleSheet) {
            style.styleSheet.cssText = _css;
        } else {
            style.appendChild(document.createTextNode(_css));
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    contains(__baseElement = document, __selector, __text) {
        var elements = __baseElement.querySelectorAll(__selector);
        const regex = new RegExp(__text);
        return [].filter.call(elements, function(element){
            return regex.test(element.textContent);
        });
    }

    getElementsByStyle = (__baseElm, __property, __value) =>{
        const allElements = __baseElm.getElementsByTagName('*');
        const matchedElements = [];

        for (let element of allElements) {
            const style = window.getComputedStyle(element);
            if (style[__property] === __value) {
            matchedElements.push(element);
            }
        }

        return matchedElements;
    }

    toggleClass = (__selector, __className, __add) => {
        document.querySelectorAll(__selector)
                .forEach((elm) => {
                    (__add)? elm.classList.add(__className): elm.classList.remove(__className);
                });
    }

    removeAll = (__baseElements, __selector) => {
        __baseElements.querySelectorAll(__selector).forEach((elm) => elm.remove());
    }

    highlightForm = (__targetElm, __color, __durationMs) => {
        __targetElm.style.backgroundColor = __color;
        __targetElm.style.transition =  __durationMs+"ms";
        setTimeout(() => {
            __targetElm.style.backgroundColor = "";
        }, __durationMs * (3/5));
    }
    
    highlightElement = (__targetElm, __color, __durationMs) => {
        __targetElm.style.border = `solid 2px ${__color}`;
        __targetElm.style.transition =  __durationMs+"ms";
        setTimeout(() => {
            __targetElm.style.border = "";
        }, __durationMs);
    }

    fadeOutAndRemove = async (__elm, __timeout = 1000) => {
        return new Promise((resolve, reject) => {
            __elm.style.transition = __timeout+"ms";
            __elm.style.opacity = 0;
            setTimeout(() => {
                __elm.remove();
                resolve();
            }, __timeout);
        });
    }

    // Date Time Conversion
    timeToLocalDateString = (__unixtime) => {
        return new Date(__unixtime).toLocaleString("ja", this.#DATE_OPTIONS).replace(/\//g, "-");
    }

    timeToSpecificDateString = (__unixtime, __ianaTimezone, __tzLabel) => {
        return new Date(
                    new Date(__unixtime).toLocaleString('en-US', {timeZone: __ianaTimezone})
                ).toLocaleString("ja", this.#DATE_OPTIONS)
                .replace(/\//g, "-")
                .replace(/(:[0-9][0-9]) .+/, "$1 "+__tzLabel);
    }

    formatDateInLocalLanguage = (__date) => {
        return __date.toLocaleString(navigator.language,this.#DATE_OPTIONS);
    }

    appendLocalTimeElm = (__targetElm, __dateTimeStr) => {
        const dateDiv = document.createElement("div");
        dateDiv.classList.add(IA_UTILS.KEY.CLASS__LOCALTIME);
        dateDiv.style.color = "darkblue";
        dateDiv.textContent = `(${this.formatDateInLocalLanguage(new Date(Date.parse(__dateTimeStr)))})`;
        __targetElm.appendChild(dateDiv);
    }

    adjustDateToLocaltime = (__dateStr, __fromTimezone) => {
        const formatter = new Intl.DateTimeFormat("en-US", {timeZone: "America/Los_Angeles" ,timeZoneName: "longOffset"});
        const gmtOffset = formatter.format(new Date(__dateStr)).split('GMT')[1];
        return this.formatDateInLocalLanguage(new Date(__dateStr +gmtOffset))
    }

    addOpenInNewTabAction = (__linkElm) => {
        __linkElm.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(__linkElm.getAttribute("href"));
        });
    }

    addShortcutKey = (__assignedKey, __function) => {
        const targetKey = `Key${__assignedKey.toUpperCase()}`;
        document.addEventListener('keydown', (e) => {
            if(e.shiftKey && e.code === targetKey
                && ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey))
            ) {
                e.preventDefault();
                console.log(`${this.LOG} addShortcutKey() shortcut key is triggered`, e);
                __function(e);
            }
        });
    }

    // Download as a JSON file
    downloadAsJsonFile = async (__dataEntries) => {
        const json = JSON.stringify(__dataEntries, null, 3);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `customization_config_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /// 
    /// DOM manipulation helper methods
    ///
    /**
     * Creates a styled DOM element with optional classes and styles
     * @param {string} tagName - HTML tag name (e.g., 'div', 'span', 'button')
     * @param {Object} options - Configuration object
     * @param {string|string[]} options.classes - CSS class name(s) to add
     * @param {Object} options.styles - Object with CSS style properties
     * @param {string} options.textContent - Text content for the element
     * @param {Object} options.dataset - Object with data attributes
     * @returns {HTMLElement} Created element
     */
    createStyledElement = (tagName, options = {}) => {
        const element = document.createElement(tagName);
        
        if (options.classes) {
            const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
            element.classList.add(...classes);
        }
        
        if (options.styles) {
            Object.assign(element.style, options.styles);
        }
        
        if (options.textContent !== undefined) {
            element.textContent = options.textContent;
        }
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }
        
        return element;
    }

    /**
     * Creates a button element with common styling
     * @param {string} text - Button text
     * @param {Object} options - Configuration object
     * @param {string|string[]} options.classes - CSS class name(s)
     * @param {Object} options.styles - Additional CSS styles
     * @param {Function} options.onClick - Click event handler
     * @returns {HTMLButtonElement} Created button element
     */
    createButton = (text, options = {}) => {
        const button = this.createStyledElement('button', {
            textContent: text,
            classes: options.classes,
            styles: options.styles,
            dataset: options.dataset,
        });
        
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        return button;
    }

    /**
     * Creates a span element with common styling
     * @param {string|Object} contentOrOptions - Text content or options object
     * @param {Object} options - Configuration object (if first param is string)
     * @returns {HTMLSpanElement} Created span element
     */
    createSpan = (contentOrOptions, options = {}) => {
        if (typeof contentOrOptions === 'string') {
            return this.createStyledElement('span', {
                textContent: contentOrOptions,
                ...options,
            });
        } else {
            return this.createStyledElement('span', contentOrOptions);
        }
    }
}