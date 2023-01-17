import {
  PanelPlugin,
  LogSystemAdapter,
  InteractionSystemAdapter,
  EventSystemAdapter,
  StorageSystemAdapter,
  DataSourceSystemAdapter,
  StyleSystemAdapter,
} from './../../DTCD-SDK';

import pluginMeta from './Plugin.Meta';
import PluginComponent from './PluginComponent.vue';

export class VisualizationAccumulators extends PanelPlugin {
  #id;
  #guid;
  #vueComponent;
  #logSystem;
  #eventSystem;
  #dataSourceSystem;
  #dataSourceSystemGUID;
  #storageSystem;

  #config = {
    isSettingsFromDatasource: false,
    ...this.defaultConfig,
    dataSource: '',
  };

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid, selector) {
    super();

    this.#guid = guid;
    this.#id = `${pluginMeta.name}[${guid}]`;

    this.#logSystem = new LogSystemAdapter('0.5.0', guid, pluginMeta.name);
    const interactionSystem = new InteractionSystemAdapter('0.4.0');
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#eventSystem.registerPluginInstance(this);
    this.#storageSystem = new StorageSystemAdapter('0.5.0');
    const styleVariables = new StyleSystemAdapter('0.4.0').getCurrentTheme().styleVariables;

    this.#dataSourceSystem = new DataSourceSystemAdapter('0.2.0');
    this.#dataSourceSystemGUID = this.getGUID(
      this.getSystem('DataSourceSystem', '0.2.0')
    );

    const { default: VueJS } = this.getDependence('Vue');

    const view = new VueJS({
      data: () => ({
        guid,
        logSystem: this.#logSystem,
        interactionSystem,
        styleVariables,
      }),
      render: h => h(PluginComponent),
    }).$mount(selector);

    this.#vueComponent = view.$children[0];
  }

  setVueComponentPropValue(prop, value) {
    const vueFields = Object.keys(this.#vueComponent);
    if (vueFields.includes(prop)) {
      this.#vueComponent[prop] = value;
    }
  }

  setPluginConfig(config = {}) {
    this.#logSystem.debug(`Set new config to ${this.#id}`);
    this.#logSystem.info(`Set new config to ${this.#id}`);

    // const configProps = Object.keys(this.#config);

    for (const [prop, value] of Object.entries(config)) {
      // if (!configProps.includes(prop)) continue;

      if (prop !== 'dataSource') {
        this.setVueComponentPropValue(prop, value);
      } else if (value) {
        if (this.#config[prop]) {
          this.#logSystem.debug(
            `Unsubscribing ${this.#id} from DataSourceStatusUpdate({ dataSource: ${this.#config[prop]}, status: success })`
          );
          this.#eventSystem.unsubscribe(
            this.#dataSourceSystemGUID,
            'DataSourceStatusUpdate',
            this.#guid,
            'processDataSourceEvent',
            { dataSource: this.#config[prop], status: 'success' },
          );
        }

        const dsNewName = value;

        this.#logSystem.debug(
          `Subscribing ${this.#id} for DataSourceStatusUpdate({ dataSource: ${dsNewName}, status: success })`
        );

        this.#eventSystem.subscribe(
          this.#dataSourceSystemGUID,
          'DataSourceStatusUpdate',
          this.#guid,
          'processDataSourceEvent',
          { dataSource: dsNewName, status: 'success' },
        );

        const ds = this.#dataSourceSystem.getDataSource(dsNewName);

        if (ds && ds.status === 'success') {
          const data = this.#storageSystem.session.getRecord(dsNewName);
          this.loadData(data);
        }
      }

      this.#config[prop] = value;
      this.#logSystem.debug(`${this.#id} config prop value "${prop}" set to "${value}"`);
    }
  }

  loadData(data) {
    this.#vueComponent.setDataset(data);
  }

  processDataSourceEvent(eventData) {
    const { dataSource, status } = eventData;
    const data = this.#storageSystem.session.getRecord(dataSource);
    this.#logSystem.debug(
      `${this.#id} process DataSourceStatusUpdate({ dataSource: ${dataSource}, status: ${status} })`
    );

    if (this.#config.isSettingsFromDatasource) {
      if (data.length > 0) {
        if (data[0]?.title) {
          this.setVueComponentPropValue('title', data[0]?.title);
        }
      }
    }

    this.loadData(data);
  }

  getPluginConfig() {
    const config = {
      ...this.#config,
      title: this.#vueComponent.title,
    };
    return config;
  }

  setFormSettings(config) {
    return this.setPluginConfig(config);
  }

  getFormSettings() {
    return {
      fields: [
        {
          component: 'input',
          propName: 'title',
          attrs: {
            label: 'Заголовок панели',
          },
        },
        {
          component: 'divider',
        },
        {
          component: 'datasource',
          propName: 'dataSource',
          attrs: {
            label: 'Выберите источник данных',
            placeholder: 'Выберите значение',
            required: true,
          },
        },
      ],
    };
  }

  getState() {
    return Object.assign(
      this.getPluginConfig(),
      { dataset: this.#vueComponent.dataset },
    );
  }

  setState(newState) {
    if (typeof newState !== 'object' ) return;

    this.setPluginConfig(newState);

    const vueNamesFields = [
      'dataset',
    ];

    for (const [prop, value] of Object.entries(newState)) {
      if (!vueNamesFields.includes(prop)) continue;
      this.#vueComponent[prop] = value;
    }
  }
}
