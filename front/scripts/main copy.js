import { dc } from "eixes";
import TimeCapsule from "./TimeCapsule";
import $ from 'jquery';

class CanvasVideo {
  constructor(id) {
    $.ajax({
      url: 'http://192.168.1.109:3000/test',
      method: 'POST',
      data: JSON.stringify({ hash: id }),
      contentType: 'application/json',
      success: src => {
        this.video.src = src;
      }
    })
    const canvas = dc.id(id);
    let canvasClone = canvas.cloneNode();

    this.video = document.createElement('video');
    this.video.style.display = "none";
    document.body.appendChild(this.video);

    let animationAuthorization = true;
    let wholeTime;
    let spentTime = new TimeCapsule(0);

    let getInterval = setInterval(() => {
      if (this.video.readyState > 0) {
        wholeTime = new TimeCapsule(this.video.duration);
        controlBar.dataset.wholetime = wholeTime.getByMinute();
        controlBar.dataset.spenttime = spentTime.getByMinute();

        canvasClone.width = this.video.videoWidth;
        canvasClone.height = this.video.videoHeight;

        clearInterval(getInterval)
      }
    }, 200);

    //inner functions


    //control functions


    //create elements
    let container = document.createElement('div');
    container.classList.add('canvasPlayer');
    container.appendChild(canvasClone);
    let hoverTimeout;
    container.onmousemove = () => {
      clearInterval(hoverTimeout);
      container.classList.add('hover');

      hoverTimeout = setTimeout(() => {
        container.classList.remove('hover');
      }, 3000);
    }
    container.onmouseout = () => {
      container.classList.remove('hover');
    }


    let controlBar = document.createElement('div');
    controlBar.classList.add('controlBar');
    container.appendChild(controlBar);

    let progressBar = document.createElement('div');
    progressBar.classList.add('progressBar');
    progressBar.onclick = e => {
      let progress = (e.layerX / progressBar.clientWidth) * 100;
      jumpVideo({ timestamp: (progress * wholeTime.time) / 100 });
      progressBar.style.setProperty('--progress', progress);
    }
    controlBar.appendChild(progressBar);

    let fullscButton = createButton('', toggleFullscreen, { className: "fullsc", altIcon: '' });
    createButton('', () => { jumpVideo({ amount: 15 }) });
    let playButton = createButton('', toggleVideoPlay, { altIcon: '' });
    createButton('', () => { jumpVideo({ amount: -15 }) });

    container.ondblclick = () => {
      toggleFullscreen(fullscButton)
    }

    canvasClone.onclick = () => { toggleVideoPlay(playButton) };

    canvas.replaceWith(container);
  }
  //control functions
  toggleVideoPlay = (playButton) => {
    let isVideoPlaying = playButton.classList.toggle('active');
    if (!isVideoPlaying) {
      video.pause();
      animationAuthorization = false;
    } else {
      video.play();
      animationAuthorization = true;
      paintCanvas(video, canvasClone)
    }
  }
  openFullscreen = () => {
    let dc = document.documentElement;
    if (dc.requestFullscreen) {
      dc.requestFullscreen();
    } else if (dc.webkitRequestFullscreen) { /* Safari */
      dc.webkitRequestFullscreen();
    } else if (dc.msRequestFullscreen) { /* IE11 */
      dc.msRequestFullscreen();
    }
  }
  closeFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  }
  toggleFullscreen = (fullScButton) => {
    let isFull = fullScButton.classList.toggle('active');
    container.classList.toggle('fullscreen');

    if (isFull) {
      openFullscreen();
    } else {
      closeFullscreen();
    }
  }
  jumpVideo = ({ amount, timestamp }) => {
    if (amount)
      video.currentTime += amount;
    else if (timestamp)
      video.currentTime = timestamp;
    if (video.paused) {
      toggleVideoPlay(playButton);
      toggleVideoPlay(playButton);
    }
  }
  //inner functions
  paintCanvas = (video, canvas) => {
    let context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (Math.floor(video.currentTime) !== spentTime.time) {
      spentTime.set(Math.floor(video.currentTime));
      controlBar.dataset.spenttime = spentTime.getByMinute();
      let progress = (spentTime.time / wholeTime.time) * 100;
      progressBar.style.setProperty('--progress', progress);
    }

    if (animationAuthorization)
      requestAnimationFrame(() => { paintCanvas(video, canvas) });
  }
  createButton = (icon, onclick, { className, altIcon } = {}) => {
    let button = document.createElement('button');
    button.dataset.icon = icon;
    if (className)
      button.className = className;
    if (altIcon)
      button.dataset.altIcon = altIcon;

    button.onclick = () => { onclick(button) };

    controlBar.appendChild(button);
    return button
  }
}

dc.queries('canvas.video').forEach(canvas => {
  let video = new CanvasVideo(canvas.id);
})