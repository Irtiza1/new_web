fetch('http://localhost:3000/api/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messenger_username: 'Luxe Founde' })
}).then(res => res.json()).then(console.log).catch(console.error);
