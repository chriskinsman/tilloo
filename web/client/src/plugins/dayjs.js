import dayjs from "dayjs";

export default function install(Vue) {
  Vue.filter("formatDate", (value) => {
    if (value) {
      return dayjs(value).format("M/D/YY h:mm A");
    }
  });
}
