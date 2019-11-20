import { select, templates, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(bookingWidget) {
    const thisBooking = this;

    thisBooking.render(bookingWidget);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }

  getData() {
    const thisBooking = this;


    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam
      ],
    };
    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('getData urls', urls);


    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};
    console.log(bookings);
    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      console.log(thisBooking.booked);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
      //console.log(item);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      //console.log(item);
    }


    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] === 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);


    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      if (typeof table == 'object') {
        for (let t of table) {
          thisBooking.booked[date][hourBlock].push(t);
        }
      } else {
        thisBooking.booked[date][hourBlock].push(table);
      }
    }
  }

  updateDOM() {
    const thisBooking = this;

    console.log('data',thisBooking.datePicker.value);
    thisBooking.date = thisBooking.datePicker.value;
    //console.log(thisBooking.date);
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&

        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) //tylko, że ja mam w tablicy
      ) {
        table.classList.remove(classNames.booking.tableClicked);
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }


  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget(element);
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.element = utils.createDOMFromHTML(generatedHTML);
    element.appendChild(thisBooking.dom.wrapper.element);
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.datePicker.corretValue = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.formSubmit = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
    thisBooking.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.duration = thisBooking.dom.wrapper.querySelector('[name="hours"]');
    thisBooking.dom.people = thisBooking.dom.wrapper.querySelector('[name="people"]');
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    //console.log(thisBooking.dom.starters);
  }


  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker, thisBooking.dom.tables);
    console.log(thisBooking.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.wrapper.addEventListener('updated', function() {
      thisBooking.updateDOM();
    });


    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function() {

        if (!table.classList.contains(classNames.booking.tableBooked)) { //jeśli obiekt table nie zawiera klasy booked
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          if (!isNaN(tableId)) {
            tableId = parseInt(tableId);
          }
          table.classList.toggle(classNames.booking.tableClicked);
          thisBooking.selectTable = tableId;
        }

      });
    }
    /*for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function() {
        if (!table.classList.contains(classNames.booking.tableBooked)) { //jeśli obiekt table nie zawiera klasy booked
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          if (!isNaN(tableId)) {
            tableId = parseInt(tableId);
          }


          for (let table of thisBooking.dom.tables) {
            if (table.classList.contains(classNames.booking.tableClicked)) {
              table.classList.remove(classNames.booking.tableClicked);
            }
          }

          if(thisBooking.selectTable == tableId) {
            thisBooking.selectTable = null;
          } else {
            table.classList.add(classNames.booking.tableClicked);
            thisBooking.selectTable = tableId;
          }
        } 
      });
    }*/

  }



  initActions() {
    const thisBooking = this;

    thisBooking.dom.formSubmit.addEventListener('click', function() {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }


  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      address: thisBooking.address.value,
      phone: thisBooking.phone.value,
      starters: [],
      duration: parseInt(thisBooking.dom.duration.value),
      ppl: parseInt(thisBooking.dom.people.value),
      table: []
      //table: thisBooking.selectTable,
    };
    console.log(thisBooking.datePicker.value);
    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains(classNames.booking.tableClicked)) {
        thisBooking.tableId = table.getAttribute(settings.booking.tableIdAttribute);
        if (!isNaN(thisBooking.tableId)) {
          thisBooking.tableId = parseInt(thisBooking.tableId);
        }
        payload.table.push(thisBooking.tableId);
      }
    }

    //console.log(thisBooking.selectTable);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response) {
        return response.json();
      }).then(function(parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
        thisBooking.updateDOM();
      });
  }
}


export default Booking;
