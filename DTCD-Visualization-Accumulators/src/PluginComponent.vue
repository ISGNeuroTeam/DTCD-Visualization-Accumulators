<template>
  <div class="VisualizationAccumulators">
    <div v-if="title" class="Header">
      <div class="Title">{{ title }}</div>
    </div>
    <div class="Body">
      <div class="NoData">
        <span class="FontIcon name_infoCircleOutline Icon"></span>
        Нет данных для отображения
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
};
</script>

<style lang="scss" scoped>
@import './styles/VisualizationAccumulators.scss';
</style>
