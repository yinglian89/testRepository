<template>
  <div class="bg">
    <!-- 音乐盒 -->
    <div class="music-box">
      <!-- 上 -->
      <div class="head-box">
        <div class="title">天籁之音</div>
        <input
          v-model="search"
          class="input-search"
          type="text"
          @keyup.enter="(event) => event.target.blur()"
          @blur="getList"
        />
        <img
          @click="getList"
          class="icon-search"
          src="../../assets/search.svg"
          alt=""
        />
      </div>
      <!-- 中 -->
      <div class="content-box">
        <!-- 左边歌曲列表 -->
        <div class="list">
          <ul>
            <!-- 点击单曲 -->
            <li
              @click="play(item.id, index)"
              v-for="(item, index) in songsList"
              :key="item.id"
              :class="{ selected: selectedSong == item.id }"
            >
              <div>
                <img
                  :src="
                    isPlaying && selectedSong == item.id
                      ? require('../../assets/pause.png')
                      : require('../../assets/play.png')
                  "
                  alt=""
                />
              </div>
              <div class="song">
                {{ item.name }}
                {{
                  item.artists && item.artists[0] && item.artists[0].name
                    ? " — " + item.artists[0].name
                    : ""
                }}
              </div>
            </li>
          </ul>
        </div>
        <!-- 中间专辑封面 -->
        <div class="cover" @click="toggle()">
          <!-- 专辑封面 -->
          <div
            v-show="!isShowMusicLyric"
            :style="{
              backgroundImage: 'url(' + coverUrl + ')',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'repeat',
            }"
            :class="{ rotate: isPlaying, pic: 'true' }"
          ></div>
          <!-- 歌词 -->
          <div class="lyric" v-show="isShowMusicLyric">
            <ul class="lyricUrl" ref="lyric">
              <li
                :class="{
                  each: true,
                  choose: index == lyricIndex - 1,
                }"
                v-for="(item, index) in currentMUsicLyric"
                :key="index"
              >
                {{ item.str }}
              </li>
            </ul>
          </div>
        </div>
        <!-- 右边评论 -->
        <div class="comment">
          <div class="title">热门留言:</div>
          <!-- 复制单元 -->
          <div v-for="item in comments" :key="item.commentId" class="content">
            <div><img :src="item.user.avatarUrl" alt="" /></div>
            <div>
              <div class="author">
                <span>{{ item.user.nickname }}:</span>
                {{ item.content }}
              </div>
              <div class="others">
                <div class="date">{{ item.timeStr }}</div>
                <div class="loveNum"><span>♥ </span>{{ item.likedCount }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 下 -->
      <div class="foot-box">
        <audio
          id="audio"
          ref="audio"
          class="audioMusic"
          :src="songUrl"
          controls="controls"
          @ended="audioFinished"
          @pause="isPlaying = false"
          @play="isPlaying = true"
          @timeupdate="updateTime"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  </div>
</template>
<script>
import $axios from "axios";
export default {
  data() {
    return {
      audio: "",
      search: "", //输入搜索的关键词
      songUrl: "", //歌曲的url
      coverUrl: require("../../assets/cipan.png"), //专辑封面图片url
      comments: [], //歌曲评论
      songsList: [], //歌单
      selectedSong: "", //选中的歌曲
      isPlaying: false,
      num: 0, //记录播放列表中的第几首
      lyric: "", //res歌词
      currentMUsicLyric: {}, //处理完的歌词
      currentTime: 0, //当前播放的时间点
      lyricIndex: 0, //高亮行
      isShowMusicLyric: true,
    };
  },
  created() {},
  mounted() {
    this.getList();
  },
  methods: {
    toggle() {
      this.isShowMusicLyric = !this.isShowMusicLyric;
    },

    // 获取当前播放进度
    updateTime(e) {
      this.currentTime = e.target.currentTime * 1000;
      for (let i = 0; i < this.currentMUsicLyric.length; i++) {
        if (this.currentMUsicLyric[i].time > this.currentTime) {
          this.lyricIndex = i;
          break;
        }
      }
      // console.log("this.lyricIndex", this.lyricIndex);
    },

    //获取歌词
    async getLyric(id) {
      try {
        let res = await $axios({
          method: "get",
          url: "https://autumnfish.cn/lyric",
          params: {
            id: id,
          },
        });
        this.lyric = res.data.lrc.lyric;
        // console.log("歌词", res.data.lrc.lyric);
        // return res.data.lrc.lyric;
      } catch (err) {
        console.log(err);
      }
    },

    //处理歌词
    async handleLyric(id) {
      await this.getLyric(id);
      this.currentMUsicLyric = this.lyric.split("\n");
      this.currentMUsicLyric = this.currentMUsicLyric.slice(
        0,
        this.currentMUsicLyric.length - 1
      );
      this.currentMUsicLyric = this.currentMUsicLyric.map((item) => {
        item = item.replace("[", "");
        let m = Number(item.split("]")[0].split(":")[0]);
        let s = Number(item.split("]")[0].split(":")[1]);
        let time = (m * 60 + s) * 1000;
        let str = item.split("]")[1];
        item = { time, str };
        return item;
      });
      // console.log("currentMUsicLyric", this.currentMUsicLyric);
    },

    //单击播放
    async play(id, index) {
      var audio = document.querySelector("#audio");
      if (id == this.selectedSong) {
        if (this.isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
      } else {
        await this.getUrl(id);
        this.getCover(id);
        this.getComment(id);
        this.handleLyric(id);
        this.selectedSong = id;
        this.num = index;
        audio.play();
        // console.log("this.selectedSong", this.selectedSong);
      }
    },

    //播放结束时列表循环/单曲循环
    audioFinished() {
      // if (this.num < this.songsList.length - 1) {
      //   this.num++;
      // } else {
      // this.num = 0;
      // }
      this.play(this.songsList[this.num].id, this.num);
    },

    // 获取歌曲评论
    async getComment(id) {
      try {
        let res = await $axios({
          method: "get",
          url: "https://autumnfish.cn/comment/new",
          params: {
            id: id,
            type: 0,
          },
        });
        if (res && res.data && res.data.data && res.data.data.comments) {
          this.comments = res.data.data.comments;
        } else {
          this.comments = [];
        }
        // console.log("歌曲评论", res.data.data.comments);
      } catch (err) {
        console.log(err);
      }
    },

    // 获取专辑封面
    async getCover(id) {
      try {
        let res = await $axios({
          method: "get",
          url: "https://autumnfish.cn/song/detail",
          params: {
            ids: id,
          },
        });
        if (
          res &&
          res.data &&
          res.data.songs &&
          res.data.songs[0] &&
          res.data.songs[0].al &&
          res.data.songs[0].al.picUrl
        ) {
          this.coverUrl = res.data.songs[0].al.picUrl;
        } else {
          this.coverUrl = require("../../assets/cipan.png");
        }
        // console.log("专辑详情", res.data.songs[0].al.picUrl);
      } catch (err) {
        console.log(err);
      }
    },

    // 获取歌曲的url
    async getUrl(id) {
      try {
        let res = await $axios({
          method: "get",
          url: "https://autumnfish.cn/song/url",
          params: {
            id: id,
          },
        });
        if (res && res.data && res.data.data[0] && res.data.data[0].url) {
          this.songUrl = res.data.data[0].url;
          // console.log("歌曲url", res.data.data[0].url);
        }
      } catch (err) {
        console.log(err);
      }
    },

    // 搜索获取歌单列表
    async getList() {
      try {
        if (this.search.length <= 0) {
          this.search = "力宏";
        }
        let res = await $axios({
          method: "get",
          url: "https://autumnfish.cn/search",
          params: {
            keywords: this.search,
            limit: 100,
          },
        });
        if (res && res.data && res.data.result) {
          this.songsList = res.data.result.songs || [];
          // console.log("搜索list", res.data.result.songs);
        }
      } catch (err) {
        console.log(err);
      } finally {
      }
    },
  },
};
</script>
<style scoped lang="less">
@import url("./index.less");
</style>