const fs = require('fs');

let formattedData = [["Date", "AM In", "AM Out", "PM In", "PM Out"]];

function parseRawLine(line) {
  if (line.trim().startsWith("#") || !line.trim()) return null;

  const match = line.match(/^.*?(\d{2})-(\d{2}),.*?(\d{1,2}:\d{2})\s?(am|pm)\s?(\d{1,2}:\d{2})\s?(am|pm)/i);
  if (!match) return null;

  const day = match[2]; // extract date (e.g. "02")
  const inRaw = convertTo12Hour(match[3], match[4]);
  const outRaw = convertTo12Hour(match[5], match[6]);

  return { day, timeIn: inRaw, timeOut: outRaw };
}

function convertTo12Hour(time, period) {
  let [hour, minute] = time.split(":").map(Number);
  if (period.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (period.toLowerCase() === "am" && hour === 12) hour = 0;
  return `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${String(minute).padStart(2, '0')}`;
}

function renderTableFromRaw(lines) {
  const tableBody = document.querySelector('#outputTable tbody');
  tableBody.innerHTML = '';
  formattedData = [["Date", "AM In", "AM Out", "PM In", "PM Out"]];

  const grouped = {};

  lines.forEach(line => {
    const parsed = parseRawLine(line);
    if (!parsed) return;

    const { day, timeIn, timeOut } = parsed;
    if (!grouped[day]) grouped[day] = [];

    grouped[day].push({ timeIn, timeOut });
  });

  for (let i = 1; i <= 31; i++) {
    const day = String(i); // No padding to keep the day as 1, 2, ..., 31
    let amIn = '', amOut = '', pmIn = '', pmOut = '';

    if (grouped[day.padStart(2, '0')]) { // Ensure compatibility with zero-padded keys
        const times = grouped[day.padStart(2, '0')];
        if (times.length === 1) {
            amIn = times[0].timeIn;
            amOut = times[0].timeOut;
        } else if (times.length >= 2) {
            amIn = times[0].timeIn;
            amOut = times[0].timeOut;
            pmIn = times[1].timeIn;
            pmOut = times[1].timeOut;
        }
    }

    formattedData.push([day, amIn, amOut, pmIn, pmOut]);
    tableBody.innerHTML += `
        <tr>
            <td>${day}</td>
            <td>${amIn}</td>
            <td>${amOut}</td>
            <td>${pmIn}</td>
            <td>${pmOut}</td>
        </tr>
    `;
  }
}

function processText() {
  const text = document.getElementById('textInput').value;
  const lines = text.trim().split('\n');
renderTableFromRaw(lines);
document.getElementById('copyButton').disabled = false; // Enable the copy button
}

function processCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert("Please upload a CSV file.");
  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split('\n');
    renderTableFromRaw(lines);
  };
  reader.readAsText(file);
}

function downloadFormattedCSV() {
  let csvContent = formattedData.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "dtr_copy.csv";
  link.click();
}

function copyTableToClipboard() {
  const table = document.getElementById('outputTable');
  let tableData = [];

  // Loop through table rows and cells to extract text, skipping the header row
  for (let i = 1; i < table.rows.length; i++) {
    let rowData = {};
    const cells = table.rows[i].cells;
    rowData["Date"] = cells[0].innerText;
    rowData["AM In"] = cells[1].innerText;
    rowData["AM Out"] = cells[2].innerText;
    rowData["PM In"] = cells[3].innerText;
    rowData["PM Out"] = cells[4].innerText;
    tableData.push(rowData);
  }

  // Convert the table data to JSON
  const jsonData = JSON.stringify(tableData, null, 2);

  // Save the JSON data to a project file
  const filePath = './dtr_text.json';
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error('Error saving file:', err);
    } else {
      console.log('File saved successfully to', filePath);
    }
  });

  
}
