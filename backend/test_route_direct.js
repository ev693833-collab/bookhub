const express = require('express');

async function testRoute() {
  const q = 'lil suzy';
  try {
    const res = await fetch('http://localhost:5000/api/music/search?q=' + encodeURIComponent(q));
    const json = await res.json();
    console.log('Result from server for lil suzy:', json);
  } catch (e) {
    console.error(e);
  }
}
testRoute();
