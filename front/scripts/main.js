import { dc } from "eixes";
import TimeCapsule from "./TimeCapsule";
import $ from 'jquery';

class CanvasVideo {
  animationAuthorization = true;
  spentTime = new TimeCapsule(0);

  constructor(id) {
    this.id = id;
    this.canvas = dc.id(id);
    this.canvasClone = this.canvas.cloneNode();

    this.video = document.createElement('video');
    this.video.style.display = "none";
    document.body.appendChild(this.video);

    $.ajax({
      url: 'http://192.168.1.109:3000/test',
      method: 'POST',
      data: JSON.stringify({ hash: id }),
      contentType: 'application/json',
      success: src => {
        this.video.src = src;
      }
    })
    let checkVideoReady = setInterval(() => {
      if (this.video.readyState > 0) {
        this.wholeTime = new TimeCapsule(this.video.duration);
        this.controlBar.dataset.wholetime = this.wholeTime.getByMinute();
        this.controlBar.dataset.spenttime = this.spentTime.getByMinute();

        this.canvasClone.width = this.video.videoWidth;
        this.canvasClone.height = this.video.videoHeight;

        clearInterval(checkVideoReady)
      }
    }, 200);

    //create container
    this.container = document.createElement('div');
    this.container.classList.add('canvasPlayer');
    this.container.appendChild(this.canvasClone);

    let hoverTimeout;
    this.container.onmousemove = () => {
      clearInterval(hoverTimeout);
      this.container.classList.add('hover');

      hoverTimeout = setTimeout(() => {
        this.container.classList.remove('hover');
      }, 3000);
    }
    this.container.onmouseout = () => {
      this.container.classList.remove('hover');
    }
    this.container.ondblclick = this.toggleFullscreen;

    //create control bar
    this.controlBar = document.createElement('div');
    this.controlBar.classList.add('controlBar');
    this.container.appendChild(this.controlBar);

    //create progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.classList.add('progressBar');
    this.progressBar.onclick = e => {
      let progress = (e.layerX / this.progressBar.clientWidth) * 100;
      this.jumpVideo({ timestamp: (progress * this.wholeTime.time) / 100 });
      this.progressBar.style.setProperty('--progress', progress);
    }
    this.controlBar.appendChild(this.progressBar);

    //create buttons
    this.fullscButton = this.#createButton('', this.toggleFullscreen, { className: "fullsc", altIcon: '' });
    this.#createButton('', () => { this.jumpVideo({ amount: 15 }) });
    this.playButton = this.#createButton('', this.toggleVideoPlay, { altIcon: '' });
    this.#createButton('', () => { this.jumpVideo({ amount: -15 }) });


    this.canvasClone.onclick = () => { this.toggleVideoPlay(this.playButton) };

    this.canvas.replaceWith(this.container);
  }
  //inner methods
  #paintCanvas = () => {
    let context = this.canvasClone.getContext('2d');
    context.drawImage(this.video, 0, 0, this.canvasClone.width, this.canvasClone.height);

    // change the timestamp
    if (Math.floor(this.video.currentTime) !== this.spentTime.time) {
      this.spentTime.set(Math.floor(this.video.currentTime));
      this.controlBar.dataset.spenttime = this.spentTime.getByMinute();
      let progress = (this.spentTime.time / this.wholeTime.time) * 100;
      this.progressBar.style.setProperty('--progress', progress);
    }

    if (this.animationAuthorization)
      requestAnimationFrame(this.#paintCanvas);
  }
  #createButton = (icon, onclick, { className, altIcon } = {}) => {
    let button = document.createElement('button');
    button.dataset.icon = icon;
    if (className)
      button.className = className;
    if (altIcon)
      button.dataset.altIcon = altIcon;

    button.onclick = () => { onclick(button) };

    this.controlBar.appendChild(button);
    return button
  }

  //control methods
  toggleVideoPlay = () => {
    let isVideoPlaying = this.playButton.classList.toggle('active');
    if (!isVideoPlaying) {
      this.video.pause();
      this.animationAuthorization = false;
    } else {
      this.video.play();
      this.animationAuthorization = true;
      this.#paintCanvas();
    }
  }
  toggleFullscreen = () => {
    const openFullscreen = () => {
      let dc = document.documentElement;
      if (dc.requestFullscreen) {
        dc.requestFullscreen();
      } else if (dc.webkitRequestFullscreen) { /* Safari */
        dc.webkitRequestFullscreen();
      } else if (dc.msRequestFullscreen) { /* IE11 */
        dc.msRequestFullscreen();
      }
    }
    const closeFullscreen = () => {
      let dc = document;
      if (dc.exitFullscreen) {
        dc.exitFullscreen();
      } else if (dc.webkitExitFullscreen) { /* Safari */
        dc.webkitExitFullscreen();
      } else if (dc.msExitFullscreen) { /* IE11 */
        dc.msExitFullscreen();
      }
    }
    let isFull = this.fullscButton.classList.toggle('active');
    this.container.classList.toggle('fullscreen');

    if (isFull) {
      openFullscreen();
    } else {
      closeFullscreen();
    }
  }
  jumpVideo = ({ amount, timestamp }) => {
    if (amount)
      this.video.currentTime += amount;
    else if (timestamp)
      this.video.currentTime = timestamp;
    if (this.video.paused) {
      this.#paintCanvas(); //refresh the picutre on the frame
    }
  }
}

dc.queries('canvas.video').forEach(canvas => {
  let video = new CanvasVideo(canvas.id);
})