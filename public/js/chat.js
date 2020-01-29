const socket = io()
// Elements
const $chatForm = document.querySelector("#chat-form")
const $chatFormInput = $chatForm.querySelector("input")
const $chatFormButton = $chatForm.querySelector("button")
const $sendLocationBtn = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // const $newMessage = $messages.lastElementChild

    // const newMessageStyles = getComputedStyle($newMessage)
    // const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // const newMessageHeight = $newMessage.offsetHeight+newMessageMargin

    // const visibleHeight = $messages.offsetHeight
    // const containerHeight = $messages.scrollHeight

    // const scrollOffset = $messages.scrollTop+visibleHeight

    // if(containerHeight - newMessageHeight <= scrollOffset) {
         $messages.scrollTop = $messages.scrollHeight
    // }
}
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationmessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createAt).format('h:mm a') 
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$chatForm.addEventListener("submit", (e)=> {
    e.preventDefault()
    const message = e.target.elements.message.value
    $chatFormButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage',message, (error) => {
        $chatFormButton.removeAttribute('disabled')
        $chatFormInput.value = ''
        $chatFormInput.focus()
        if(error) {
            return console.log('Error', error)
        }
        console.log('Message Delivered')
    })

})

$sendLocationBtn.addEventListener("click", () => {
    $sendLocationBtn.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert("Geolocation is supported by your browser.")
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared')
            $sendLocationBtn.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})