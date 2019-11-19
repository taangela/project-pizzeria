import { settings, select, classNames } from '../settings.js';
import { utils } from '../utils.js';
import BaseWidget from './BaseWidget.js';
//import Booking from './Booking.js';

export class DatePicker extends BaseWidget {
  constructor(wrapper, tables) {
    super(wrapper, utils.dateToStr(new Date()));

    const thisWidget = this;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
    thisWidget.dom.tables = tables;
  }

  initPlugin() {
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    const options = {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      onChange: function(){
        for (let table of thisWidget.dom.tables){
          table.classList.remove(classNames.booking.tableClicked);
        }
        thisWidget.value = thisWidget.dom.input.value;
      },
      disable: [
        function(date) {
          return (date.getDay() === 1);

        }
      ],
      locale: {
        'firstDayOfWeek': 1
      },
    };
    flatpickr(thisWidget.dom.input, options); // eslint-disable-line
  }

  parseValue(value) {
    return value;
  }

  isValid() {
    return true;
  }

  renderValue() {
    console.log();
  }
}

export default DatePicker;
