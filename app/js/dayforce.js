class Dayforce {
    #MODNAME = "DF>";
    #LOGHEADER = this.#MODNAME;
    #UTILS;
    #runtimeCO;

    constructor(__parentMod, __utils, __configOption) {
        this.#LOGHEADER = __parentMod + this.#LOGHEADER;
        this.#UTILS = __utils;
        this.#runtimeCO = __configOption;
    }

    get LOG() {
        return this.#LOGHEADER;
    }

    monitorDayforcePages = () => {
        this.#UTILS.invokeMethodOnInsert("div.HTMLEmployeeTimeSheet", (evt) => {
            console.log(`${this.LOG} detected HTMLEmployeeTimeSheet!`);
            
            const customToolBar = document.querySelector("span.customToolbar");
            const fillADayBtn = this.#UTILS.createButton("fill a day", {
                classes: [],
                styles: {"margin-left":"10px"},
                onClick: (e) => {
                    this.#fillASingleDay();
                }
            });
            const autoFillBtn = this.#UTILS.createButton("Auto fill", {
                classes: [],
                styles: {"margin-left":"10px"},
                onClick: (e) => {
                    console.log("button clicked!");
                    this.#runAutomaticFillUp();
                }
            });

            customToolBar.append(fillADayBtn);
            customToolBar.append(autoFillBtn);
        });
    }

    #getWorkingTime = (__day) => {
        const overrideDayTime = this.#runtimeCO.DF__OVERRIDE_WORKING_DAY_TIME;
        const overrideTimes = overrideDayTime.find(dayTime => dayTime.day == __day);

        const workingTime = [];
        if(overrideTimes) {
            overrideTimes.time.forEach(time => {
                workingTime.push(`${time.start}:00`);
                workingTime.push(`${time.end}:00`);
            });
        } else {
            const defaultDayTime = this.#runtimeCO.DF__DEFAULT_WORKING_TIME;
            defaultDayTime.forEach(time => {
                workingTime.push(`${time.start}:00`);
                workingTime.push(`${time.end}:00`);
            })
        }
        return workingTime;
    }

    #getHalfWorkingTime = () => {
        const halfdayWorkingTime = this.#runtimeCO.DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME;
        let workingTime = [];

        console.log("halfdayworking time", halfdayWorkingTime[0])
        const time = halfdayWorkingTime[0];
        halfdayWorkingTime.forEach(hdwTime => {
            workingTime.push(`${hdwTime.start}:00`);
            workingTime.push(`${hdwTime.end}:00`);
        })

        return workingTime;
    }

    #runAutomaticFillUp = async () => {
        let selectingCell = document.querySelector(".TimesheetVirtualGridEditControls");
        let targetHeader = this.#getHeaderCell(selectingCell);

        // Build target date array
        const startDate = this.#getDate(targetHeader);
        const loopDates = new Array();
        for(let i=startDate.getDate(); i<=new Date().getDate(); i++) loopDates.push(i);
        

        console.log(`${this.LOG} Lets start working`, startDate, loopDates);

        // Processing each day
        for await (const eachDate of loopDates) {
            console.log(`${this.LOG} Working on date: ${eachDate}.`);
            if(this.#checkWorkingDay(targetHeader)) {
                console.log(`${this.LOG} Filling a day and move forward.`);
                // Fill a single day form
                await this.#fillASingleDay();
                
                // Type ArrowRight key then wait a while to complete the action
                this.#triggerArrowRightKeyDown();
                await new Promise(resolve => setTimeout(()=>{
                        resolve();
                    }, 50)
                );
            } else {
                console.log(`${this.LOG} Do nothing and move a step to right`);

                // Type ArrowRight key then wait a while to complete the action
                this.#triggerArrowRightKeyDown();
                await new Promise(resolve => setTimeout(()=>{
                        resolve();
                    }, 50)
                );
            }

            // Point next cell
            selectingCell = document.querySelector(".TimesheetVirtualGridEditControls");
            targetHeader = this.#getHeaderCell(selectingCell);
        }

        console.log(`${this.LOG} Auto fill completed.`);
    }

    #fillASingleDay = () => {
        const promise = new Promise((resolve) => {
            const _WAIT = 100;

            const selectingCell = document.querySelector(".TimesheetVirtualGridEditControls");
            const selectingHeader = this.#getHeaderCell(selectingCell);
            const day = this.#getDay(selectingHeader);
            let workingTime = this.#getWorkingTime(day);

            // 0. Check if any records exist
            const currentDayCells = this.#getCurrentDayCells();
            if(currentDayCells.length > 0) {
                const existingRecord = currentDayCells.find(elm => elm.querySelector(".TimesheetPunch"));
                console.log(`${this.LOG} existingRecord`, existingRecord);
                
                if(existingRecord && existingRecord.querySelectorAll(".bottomRow .actualTotal .dijitOutput")) {
                    console.log(`${this.LOG} records`, existingRecord.querySelectorAll(".bottomRow .actualTotal .dijitOutput"));
                    const record = existingRecord.querySelector(".bottomRow .actualTotal .dijitOutput");
                    const hour = parseInt(record.textContent);

                    console.log(`${this.LOG} hour`, hour);
                    console.log("hour", hour)
                    if(hour > 0) {
                        console.log(`${this.LOG} Existing record(s) found. Skipping.`);
                        resolve();
                        return;
                    }                    
                }
            }

            
            // 1. Click on Add Shift button
            const addShiftBtn = this.#getAddShiftBtn();
            addShiftBtn.click();

            let editingCell;
            let timeOffEntry;
            let addMealComplete = false;
            let fillingComplete = false;

            let setupFieldTimerId = -1;
            let fillFieldTimerId = -1;
            let confirmFieldTimerId = -1;

            const clearAllFlags = () => {
                clearInterval(setupFieldTimerId);
                clearInterval(fillFieldTimerId);
                clearInterval(confirmFieldTimerId);
            }


            // 2. Add meal time fields
            setupFieldTimerId = setInterval(() => {
                const currentDayCells = this.#getCurrentDayCells();

                if(currentDayCells.length > 0) {
                    editingCell = currentDayCells.find(elm => elm.querySelector(".timeRow"));
                    timeOffEntry = currentDayCells.find(elm => elm.querySelector(".netHours .dijitOutput"));
                } else {
                    clearAllFlags();
                    return;
                }

                let dayOffHours = 0;
                if(timeOffEntry) {
                    dayOffHours = parseInt(timeOffEntry.querySelector(".netHours .dijitOutput.dijitHidden").textContent);
                }

                // Half day off is in place
                if(dayOffHours == 4) {
                    workingTime = this.#getHalfWorkingTime();
                    addMealComplete = true;
                } 
                
                // Whole day off is in place
                if(dayOffHours >= 8) {
                    console.log(`${this.LOG} Do nothing for a day off.`);
                    clearAllFlags();
                    resolve();
                    return; // Do nothing!
                } // Whole working day 
                else if(workingTime.length > 2) {
                    if(editingCell && editingCell.querySelectorAll(".timeRow").length < workingTime.length) {
                        const addMealBtn = editingCell.querySelector(".actionControl div[id^='addMealBreakButton_'][role='button']");
                        clearInterval(setupFieldTimerId);
                        addMealBtn.click();
                        addMealComplete = true;
                    }
                } else {
                    addMealComplete = true;
                }

                if(addMealComplete) clearInterval(setupFieldTimerId);
            }, _WAIT);
        

            // 3. Fill times
            let loopCounter = 0;
            fillFieldTimerId = setInterval(() => {
                if(!addMealComplete) return;

                const timeFields = (editingCell)? editingCell.querySelectorAll(".timeRow"):[];
                if(timeFields.length >= workingTime.length) {
                    for(let i=0; i<timeFields.length; i++) {
                        const timeInputs = timeFields[i].querySelectorAll(".dijitInputContainer input");
                        timeInputs[0].value = workingTime[i];
                        timeInputs[1].value = `T${workingTime[i]}:00`;
                    }
                    fillingComplete = true;
                    clearInterval(fillFieldTimerId);
                }

                loopCounter++;
                if(loopCounter > 10) {
                    console.log(`${this.LOG} Exiting a loop since retry exceeded limit.`);

                    clearAllFlags();
                }
            }, _WAIT);

            // 4. Click confirmBtn
            let loopCounter2 = 0;
            confirmFieldTimerId = setInterval(() => {
                if(!fillingComplete) return;

                const timeFields = editingCell.querySelectorAll(".timeRow");
                for(let i=0; i<timeFields.length; i++) {
                    if(timeFields[i].querySelector("div.checkmarkBox")) {
                        timeFields[i].querySelector("div.checkmarkBox").click();
                    } else {
                        console.log("Arrow down clicked!", timeFields[i].querySelector("div.arrowBtn.downArrow"));
                        timeFields[i].querySelector("div.arrowBtn.downArrow").click();
                    }
                }

                clearInterval(confirmFieldTimerId);
                resolve();

                // time limit
                loopCounter2++;
                if(loopCounter2 > 10) {
                    console.log(`${this.LOG} Exiting a loop since retry exceeded limit.`);
                    clearInterval(confirmFieldTimerId);
                    resolve();
                }
            }, _WAIT*1.5);
        });

        return promise;
    }

    #getAddShiftBtn = () => {
        return document.querySelector(".actionControl").querySelector("div[id^='UI_Mixins__TooltipMixin']");
    }

    #getLeftVal = (__elm) => {
        const _CELL_WIDTH = 200;
        const style = window.getComputedStyle(__elm);
        const value = style.getPropertyValue('left');

        return parseInt(value);
    }

    #getCurrentDayCells = () => {
        const editingControllCell = document.querySelector(".TimesheetVirtualGridEditControls");
        const selectedLeftVal = this.#getLeftVal(editingControllCell);

        const dayCells = document.querySelectorAll(".VirtualEmployeeDayCell");
        const currentDayCells = Array.from(dayCells).filter(cell => {
                return selectedLeftVal == this.#getLeftVal(cell);
            });

        return currentDayCells;
    }

    #getHeaderCell = (__targetCell) => {
        const headerCells = document.querySelectorAll(".VirtualHeaderCell");
        const targetLeftVal = this.#getLeftVal(__targetCell);
        const targetHeader = Array.from(headerCells).find(elm => {
            return targetLeftVal == this.#getLeftVal(elm);
        })

        return targetHeader;
    }

    #getDay = (__targetHeader) => {
        const dataLabel = __targetHeader.querySelector(".dateLabel").textContent;
        const entry = Object.entries(_DAY).find(([, value]) => dataLabel.match(value));
        return entry? entry[1]: null;
    }

    #getDate = (__targetHeader) => {
        const dateStr = __targetHeader.querySelector(".dateLabel").textContent.replace(/.*,/, "");
        return new Date(`${dateStr}, ${new Date().getFullYear()}`);
    }

    // Return false when it's holiday 
    #checkWorkingDay = (__targetHeader) => {
        // Check holiday
        if(__targetHeader.classList.contains("empHolidayBackground")) {
            return false;
        }

        // Check if the target day is working days
        const day = this.#getDay(__targetHeader);
        const workingDays = this.#runtimeCO.DF__DEFAULT_WORKING_DAY;
        const found = workingDays.find(wday => wday == day);

        return (found)? true: false;
    }

    // Simulate an ArrowRight key down
    #triggerArrowRightKeyDown = () => {
        // direction can be: 'ArrowUp', 'ArrowDown', 'ArrowLeft', or 'ArrowRight'
        const event = new KeyboardEvent("keydown", {
            key: 'ArrowRight',
            code: 'ArrowRight',
            keyCode: 39,
            bubbles: true,      // Allows the event to bubble up the DOM tree
            cancelable: true    // Allows event.preventDefault() to be called
        });

        document.querySelector("#VirtualGrid").dispatchEvent(event);
    }
}