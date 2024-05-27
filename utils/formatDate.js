exports.formatDate = (date) => {
    const pad = (number, length = 2) => number.toString().padStart(length, '0');
  
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3) + '000'; // Adding extra zeros to make it 6 digits
  
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
    const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
    const formattedOffset = `${offsetSign}${offsetHours}${offsetMinutes}`;
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${formattedOffset}`;
  }