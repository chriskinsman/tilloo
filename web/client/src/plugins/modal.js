export default function install(Vue) {
  Vue.mixin({
    methods: {
      async showModal(ModalComponent, params) {
        const modalComponent = Vue.extend(ModalComponent);
        const modalComponentInstance = new modalComponent({
          parent: this,
          propsData: params
        });

        return await modalComponentInstance.show();
      }
    }
  });
}
