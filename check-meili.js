async function checkTask() {
  const url = 'https://search.digitalsanskrit.com/tasks?limit=10';
  const res = await fetch(url, {
    headers: {
      'Authorization': 'Bearer Q7mR4v9sX2TbLpE6'
    }
  });
  const data = await res.json();
  console.log("Tasks:", JSON.stringify(data.results.slice(0, 3), null, 2));
}
checkTask();
