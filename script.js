const socket = io();

// Example: On event form submit, emit to socket for live
document.querySelector('form[action*="event"]').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const event = {
    type: formData.get('type'),
    player: formData.get('player'),
    minute: formData.get('minute'),
    detail: formData.get('detail')
  };
  socket.emit('updateMatch', matchId, event);  // matchId from page
});

// Listen for updates
socket.on('matchUpdate', (updatedMatch) => {
  // Update DOM: e.g., append to #events, update scores
  const li = document.createElement('li');
  li.textContent = `Min ${updatedMatch.events[updatedMatch.events.length-1].minute}: ...`;
  document.getElementById('events').appendChild(li);
});

function finishMatch(matchId) {
  fetch(`/match/${matchId}/finish`, { method: 'POST' }).then(() => location.reload());
}
