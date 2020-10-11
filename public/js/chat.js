const socket = io();

const $messageForm = document.querySelector('#form');
const $messageFormInput = $messageForm.querySelector('#input');
const $messageFormButton = $messageForm.querySelector('#button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild
  console.log("autoscroll -> $newMessage", $newMessage)

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  console.log("autoscroll -> newMessageMargin", newMessageMargin)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  console.log("autoscroll -> newMessageHeight", newMessageHeight)

  const visibleHeight = $messages.offsetHeight
  console.log("autoscroll -> visibleHeight", visibleHeight)

  const containerHeight = $messages.scrollHeight
  console.log("autoscroll -> containerHeight", containerHeight)

  const scrollOffset = $messages.scrollTop + visibleHeight
  console.log("autoscroll -> scrollOffset", scrollOffset)

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', message => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm A'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', message => {
  console.log(message);
  const html = Mustache.render(urlTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('hh:mm A'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', e => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');
  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, error => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) return console.log(error);

    console.log('Message delivered...');
  });
});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation is not supported by your browser');

  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $locationButton.removeAttribute('disabled');
        console.log('Location has been shared!');
      }
    );
  });
});

socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
