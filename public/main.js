var FADE_TIME = 150 // ms
var TYPING_TIMER_LENGTH = 400 // ms
var PRINT_CHAT_TIME = 2 * 60 * 1000 //ms
var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
]

var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.inputMessage'); // Input message input box

var $loginPage = $('.login.page'); // The login page
var $chatPage = $('.chat.page'); // The chatroom page
var $title = $('.title') //The login page tile
var $currentInput = $usernameInput.focus();

var socket
var isLogined = false
var latestChatTime = Date.now()
var isTyping = false
var latestTypingTime = Date.now()
var messagesOffset = 1000
console.log($('#app'))
new Vue({
    el: '#app',
    data: {
        messages: [],
        userName: '',
        userList: [],
        inputMessage: '',
        typingMsg: ''
    },
    methods: {
        initSocketIO: function() {
            //get references of Vue's property
            // var messages = this.messages
            // var userList = this.userList
            // var setUserList = this.setUserList
            // var userName = this.userName
            // var logMsg = this.logMsg
            // var addChatTyping = this.addChatTyping
            // var removeChatTyping = this.removeChatTyping
            var Vue = this

            socket = io.connect()
            setInterval(function() {
                if (isTyping && Date.now() - latestTypingTime > TYPING_TIMER_LENGTH) {
                    socket.emit('stop typing', {})
                    isTyping = false
                }
                console.log($messages.scrollTop())

            }, FADE_TIME)
            socket.on('connect', function() {
                console.log('server connected.')
                    // socket.on('add user', function(user) {})
                socket.on('sync user list', function(userList) {
                    Vue.setUserList(userList)
                })
                socket.on('user name duplicate', function() {
                    $title.text('聊天室里有人与你重名la')
                })
                socket.on('chat', function(data) {
                    Vue.messages.push(data)
                    if (Date.now() - latestChatTime > PRINT_CHAT_TIME)
                        Vue.logMsg(Date.now())
                    latestChatTime = Date.now()
                    $messages[0].scrollTop = $messages[0].scrollHeight
                })
                socket.on('typing', function(data) {
                    Vue.addChatTyping(data)
                })
                socket.on('stop typing', function(data) {
                    Vue.removeChatTyping(data)
                })
                socket.on('user joined', function(data) {
                    Vue.logMsg(data.username + '加入聊天室')
                    Vue.logMsg('当前聊天室有' + data.numUsers + '人')
                })
                socket.on('user left', function(data) {
                    Vue.logMsg(data.username + '离开聊天室')
                    Vue.logMsg('当前聊天室有' + data.numUsers + '人')
                })
            })
        },
        setName: function() {
            this.initSocketIO()
                //enter chat room
            if (this.userName) {
                socket.emit('enter chat room', this.userName)
                this.logMsg('欢迎' + this.userName + '来到聊天室')
                $loginPage.fadeOut();
                $chatPage.show();
                $loginPage.off('click');
                $currentInput = $inputMessage.focus();
                isLogined = true
            }
        },
        pushMessage: function() {
            socket.emit('stop typing', {})
            socket.emit('chat', { user: this.userName, msg: this.inputMessage })
            this.inputMessage = ''
        },
        setUserList: function(names) {
            this.userList = names
        },
        clearMessages: function() {
            this.messages = []
        },
        logMsg: function(msg) {
            this.messages.push({ log: msg })
        },
        getUserNameColor: function() {

        },
        addChatTyping: function(data) {
            this.typingMsg = data
        },
        removeChatTyping: function(data) {
            this.typingMsg = data
        },

        test: function() {}
    },
    watch: {
        'inputMessage': function(val, oldVal) {
            // if (isLogined && isTyping)
            //     socket.emit('typing', { user: this.userName, msg: val })
            if (isLogined && !isTyping) {
                socket.emit('typing', { user: this.userName, msg: '正在输入..' })
                isTyping = true
                latestTypingTime = Date.now()
                    // setTimeout(function() {
                    //     socket.emit('stop typing', {})
                    //     isTyping = false
                    // }, TYPING_TIMER_LENGTH)
            } else {
                latestTypingTime = Date.now()
            }
        },
        'messages': function() {

        }
    },
    transitions: {
        'fadeIN': {
            css: false,
            enter: function(el, done) {
                $(el)
                    .css('opacity', 0)
                    .animate({ opacity: 1 }, 10000, done)
            }
        }
    }
})