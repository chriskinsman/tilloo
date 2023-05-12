// Vuetify 3

import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { createVuetify } from 'vuetify';

import colors from "vuetify/lib/util/colors";

// Styles
import '../main.scss';
import '@mdi/font/css/materialdesignicons.css';

export default createVuetify({
  // Global configuration
  // https://next.vuetifyjs.com/en/features/global-configuration/
  /*
  defaults: {
    global: {
      ripple: false,
    },
    VSheet: {
      elevation: 4,
    },
  },
  */
  // Icon Fonts
  // https://next.vuetifyjs.com/en/features/icon-fonts/
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  // Theme
  // https://next.vuetifyjs.com/en/features/theme/
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: colors.lightBlue.base,
        }
      },
    },
  }
});