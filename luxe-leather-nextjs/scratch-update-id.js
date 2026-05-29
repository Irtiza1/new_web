fetch('http://localhost:3000/api/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ facebook_page_id: '61590459932071' })
}).then(res => res.json()).then(console.log).catch(console.error);
