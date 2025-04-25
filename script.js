let formattedData = [["Date", "AM In", "AM Out", "PM In", "PM Out"]];

function parseRawLine(line) {
  if (line.trim().startsWith("#") || !line.trim()) return null;

  const match = line.match(/^.*?(\d{2})-(\d{2}),.*?(\d{1,2}:\d{2})\s?(am|pm)\s?(\d{1,2}:\d{2})\s?(am|pm)/i);
  if (!match) return null;

  const day = match[2];
  const inRaw = convertTo12Hour(match[3], match[4]);
  const outRaw = convertTo12Hour(match[5], match[6]);

  return { day, timeIn: inRaw, timeOut: outRaw };
}

function convertTo12Hour(time, period) {
  let [hour, minute] = time.split(":").map(Number);
  if (period.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (period.toLowerCase() === "am" && hour === 12) hour = 0;
  return `${hour > 12 ? hour - 12 : hour || 12}:${String(minute).padStart(2, '0')}`;
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
    const day = String(i);
    let amIn = '', amOut = '', pmIn = '', pmOut = '';

    if (grouped[day.padStart(2, '0')]) {
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
  // document.getElementById('copyButton').disabled = false;
   processInputData();
}

function processCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert("Please upload a CSV file.");
  const reader = new FileReader();
  reader.onload = e => renderTableFromRaw(e.target.result.split('\n'));
  reader.readAsText(file);
}

function downloadFormattedCSV() {
  const csvContent = formattedData.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "dtr_copy.csv";
  link.click();
}

function copyTableToClipboard() {
  const table = document.getElementById('outputTable');
  let tableText = Array.from(table.rows)
    .slice(1)
    .map(row => Array.from(row.cells).map(cell => cell.innerText).join('\t'))
    .join('\n');

  navigator.clipboard.writeText(tableText)
    .then(() => alert('Table data copied to clipboard and saved as dtr_text.txt!'))
    .catch(err => console.error('Failed to copy table data: ', err));
}

function open_dtr(monthWord, yearLastTwoDigits) {
  const csvContent = formattedData.map(row => row.join(",")).join("\n");
  const smallData = encodeURIComponent(csvContent);
  const name = encodeURIComponent(extractName());
  const officerName = encodeURIComponent(document.getElementById("provincialOfficer")?.value || "");


  window.open(`dtr_builder.html?data=${smallData}&name=${name}&officer=${officerName}&month=${monthWord}&year=${yearLastTwoDigits}`);
}


function extractName() {
  const textInput = document.getElementById("textInput").value;
  return textInput.split("\n")[0].replace(/\s*\(.*?\)\s*/g, "");
}

function handleProvincialOfficerInput() {
  document.getElementById("provincialOfficer")?.addEventListener("input", e => {
    console.log("Provincial Officer Name:", e.target.value);
  });
}
handleProvincialOfficerInput();



function processInputData() {
  const text = document.getElementById('textInput').value;
  const lines = text.trim().split('\n');

  // Extract the date range
  const startDate = lines.find(line => line.match(/^\d{2}\/\d{2}\/\d{4}$/));
  if (!startDate) {
    console.error("No valid start date found in the input.");
    return;
  }

  // Convert the date range to "Month YY" format
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [month, , year] = startDate.split("/");
  const monthWord = months[parseInt(month, 10) - 1];
  const yearLastTwoDigits = year.slice(-2);

  // Pass the processed values
  displayMonthYear(monthWord, yearLastTwoDigits);
  open_dtr(monthWord, yearLastTwoDigits);
}

function displayMonthYear(monthWord, yearLastTwoDigits) {
  console.log(`${monthWord} ${yearLastTwoDigits}`);
}
