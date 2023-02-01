<template>
  <div class="VisualizationAccumulators">
    <div v-if="title" class="Header">
      <div class="Title">{{ title }}</div>
    </div>
    <div class="Body">
      <div v-if="!dataset.length" class="NoData">
        <span class="FontIcon name_infoCircleOutline Icon"></span>
        Нет данных для отображения
      </div>

      <div v-if="dataset.length" class="BarsContainer">
        <div
          class="Bar"
          v-for="{label, value, max, color}, i in dataset"
          :key="i + '' + value"
          :title="`max = ${max}`"
          :style="'background: linear-gradient(to right, '
                  +`${color} ${value/max*100}%, `
                  +`var(--text_secondary) ${value/max*100}%);`
          "
        >
          <span class="Label">{{label}}</span>
          <span class="Value">{{value}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'PluginComponent',
  data() {
    return {
      title: 'Accumulators',
      dataset: [],
    };
  },
  methods: {
    setDataset(data) {
      if (!Array.isArray(data)) return false;

      this.dataset = [];
      
      data.forEach((dataItem) => {
        if (!dataItem.color) {
          dataItem.color = 'var(--button_primary)';
        }
        else {
          if (this.$root.styleVariables[dataItem.color]) {
            dataItem.color = `var(--${color})`;
          }
        }

        this.dataset.push({...dataItem});
      });
    },
  }
};
</script>

<style lang="scss" scoped>
@import './styles/VisualizationAccumulators.scss';
</style>
