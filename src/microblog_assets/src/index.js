import { createActor, microblog } from "../../declarations/microblog";
import { Principal } from '@dfinity/principal'

async function setName() {
  let button = document.getElementById('set_name_button')
  let error = document.getElementById('set_error')
  error.innerText = ""
  button.disabled = true
  let input = document.getElementById('set_name')
  let text = input.value
  try {
    await microblog.set_name(text)
    input.value = ""
  } catch (err) {
    console.log(err)
    error.innerText = "Set name failed!"
  }
  button.disabled = false
}

async function follow() {
  let button = document.getElementById('follow_button')
  let error = document.getElementById('follow_error')
  error.innerText = ""
  button.disabled = true
  let input = document.getElementById('follow')
  let text = input.value
  try {
    await microblog.follow(Principal.fromText(text))
    input.value = ""
  } catch (err) {
    console.log(err)
    error.innerText = "Follow failed!"
  }
  button.disabled = false
}

async function post() {
  let button = document.getElementById('post_button')
  let error = document.getElementById('post_error')
  error.innerText = ""
  button.disabled = true
  let input = document.getElementById('message')
  let text = input.value
  try {
    await microblog.post(text)
    input.value = ""
  } catch (err) {
    console.log(err)
    error.innerText = "Post failed!"
  }
  button.disabled = false
}

let show_all = true
async function showAllTimeline() {
  show_all = true
  const title = document.getElementById('timeline_title')
  title.replaceChildren([])
  title.innerText = 'Timeline'

  let section = document.getElementById('timeline')
  let timeline = await microblog.timeline(0)
  section.replaceChildren([])
  for (var i = 0; i < timeline.length; i++) {
    let post = document.createElement('p')
    let author = timeline[i].author
    let text = timeline[i].content
    let time = new Date(parseInt(timeline[i].time.toString().slice(0, 13)))
    post.innerText = `${author}: ${text} \t${time}`
    section.appendChild(post)
  }
}

async function showTimelineById(id) {
  show_all = false
  const actor = createActor(id)
  const [name, posts] = await Promise.all([actor.get_name(), actor.posts(0)])
  const titleWrap = document.getElementById('timeline_title')
  titleWrap.replaceChildren([])
  const title = document.createElement('span')
  title.innerText = `Timeline ${name}`
  const button = document.createElement('button')
  button.innerText = 'Show all'
  button.onclick = showAllTimeline
  titleWrap.appendChild(title)
  titleWrap.appendChild(button)
  const section = document.getElementById('timeline')
  section.replaceChildren([])
  for (var i = 0; i < posts.length; i++) {
    let post = document.createElement('p')
    let author = posts[i].author
    let text = posts[i].content
    let time = new Date(parseInt(posts[i].time.toString().slice(0, 13)))
    post.innerText = `${author}: ${text} \t${time}`
    section.appendChild(post)
  }
}

var numFollows = 0
async function loadFollows() {
  let section = document.getElementById('follows')
  let follows = await microblog.follows()

  if (numFollows === follows.length) return
  numFollows = follows.length

  section.replaceChildren([]);
  (
    await Promise.all(follows.map(async function(_, i) {
      let follow = document.createElement('p')
      let id = follows[i].toText()
      const actor = createActor(id)
      const name = await actor.get_name()
      follow.innerText = `${name}(${id})`
      follow.style = 'color:blue; cursor:pointer;'
      follow.onclick = () => showTimelineById(id)
      return follow
    }))
  ).forEach(follow => {
    section.appendChild(follow)
  });
}

var numPosts = 0
async function loadPosts() {
  let section = document.getElementById('posts')
  let posts = await microblog.posts(0)

  if (numPosts === posts.length) return
  numPosts = posts.length

  section.replaceChildren([])
  for (var i = 0; i < posts.length; i++) {
    let post = document.createElement('p')
    let author = posts[i].author
    let text = posts[i].content
    let time = new Date(parseInt(posts[i].time.toString().slice(0, 13)))
    post.innerText = `${author}: ${text} \t${time}`
    section.appendChild(post)
  }
}

var numTimeline = 0
async function loadTimeline() {
  if (!show_all) return
  let section = document.getElementById('timeline')
  let timeline = await microblog.timeline(0)

  if (numTimeline === timeline.length) return
  numPosts = timeline.length

  section.replaceChildren([])
  for (var i = 0; i < timeline.length; i++) {
    let post = document.createElement('p')
    let author = timeline[i].author
    let text = timeline[i].content
    let time = new Date(parseInt(timeline[i].time.toString().slice(0, 13)))
    post.innerText = `${author}: ${text} \t${time}`
    section.appendChild(post)
  }
}

function load() {
  let set_name_button = document.getElementById("set_name_button")
  set_name_button.onclick = setName

  let follow_button = document.getElementById("follow_button")
  follow_button.onclick = follow

  let post_button = document.getElementById("post_button")
  post_button.onclick = post

  loadFollows()
  loadPosts()
  if (show_all) loadTimeline()

  setInterval(() => {
    loadFollows()
    loadPosts()
    if (show_all) loadTimeline()
  }, 3000)
}

window.onload = load
