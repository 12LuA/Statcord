<template>
    <div>
        <div>
            <div>
                <USelect v-model="allTimeOrDateRangeSelection" name="allTimeOrDateRangeSelection" :options="allTimeOrDateRange" @change="dateOrAllTimeChanged"/>
                <label for="allTimeOrDateRangeSelection">Select date range</label>
            </div>

            <div>
                <USelect v-model="groupBySelection" name="groupBySelection" :options="groupBySelections"  @change="groupBySelectorChanged"/>
                <label for=groupBySelection>Select group by range</label>
            </div>

            <div v-if="showDateRange">
                <label>Start date:</label>
                <input type="date" @change="updateStartDate" :min="datePickerMin" :max="datePickerMax" :value="datePickerMin">

                <label>End date:</label>
                <input type="date" @change="updateEndDate" :min="datePickerMin" :max="datePickerMax" :value="datePickerMax">
            </div>
        </div>

        <div class="pt-8 pb-8">
            <div v-if="stats.length>0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UCard v-for="card in cards" class="text-center">
                    <template #header>
                        <span class="h-1 align-middle text-gray-300">{{ card.name }}</span>
                    </template>

                    <span class="h-1 align-middle text-gray-300">{{ parseInt(card.value).toLocaleString() }}</span>
                </UCard>
            </div>
        </div>

        <div>
            <div v-if="stats.length>0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-for="stat in stats" :key="stat.id">
                    <h1>{{ stat.name }}</h1>
                    <chart :chartData="stat.data" :chartType="stat.type" :chartOptions="stat.options"></chart>
                </div>
                
                <div v-for="stat in commandStats" :key="stat.id">
                    <h1>{{ stat.name }}</h1>
                    <chart :chartData="stat.data" :chartType="stat.type" :chartOptions="stat.options"></chart>
                </div>

                <div v-for="stat in customStats" :key="stat.id">
                    <h1>{{ stat.name }}</h1>
                    <chart :chartData="stat.data" :chartType="stat.type" :chartOptions="stat.options"></chart>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { useRoute } from 'vue-router';
    const route = useRoute()

    const formatDate = (timeStamp) => {
        const date = new Date(timeStamp)
        return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    const bytesToSize = (bytes) => {
        const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];
        const unit = Math.floor(Math.log(bytes) / Math.log(1024));
        return new Intl.NumberFormat("en", {style: "unit", unit: units[unit]}).format(bytes / 1024 ** unit);
    }

    const defaultStatsJson = await $fetch(`/api/bots/${route.params.id}/stats?groupBy=1d`)

    const stats = defaultStatsJson.mainStats.stats.map(t=>{
        t.data.labels = defaultStatsJson.mainStats.labels.map(d=>formatDate(d))
        switch(t.name){
            case "CPU Usage":{
                t.options = {
                        scales: {
                            y: {
                                ticks: {
                                    callback: value => `${value}%` 
                                },
                                beginAtZero: true
                            }
                        },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => `${context.dataset.label} ${context.parsed.y}%`
                            }
                        }
                    }
                }
            }break;
            case "Ram Usage":{
                t.options={
                    scales: {
                        y: {
                            ticks: {
                                callback: value => bytesToSize(value) 
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => `${context.dataset.label}: ${bytesToSize(context.parsed.y)}`
                            }
                        }
                    }
                }
            }break;
        }
        return t
})

const commandStats = defaultStatsJson.commands.map(t=>{
    if (t.name==="Command usage over time") t.data.labels = t.labels.map(d=>formatDate(d))
    return t
})
const customStats = defaultStatsJson.custom?.map(t=>{
    if (t.type === "line") t.data.labels = defaultStatsJson.mainStats.labels.map(d=>formatDate(d))
    return t
})

const cards = defaultStatsJson.cards
</script>

<script>
import chart from './chart.vue'

const allTimeOrDateRange = ['All Time', 'Date Range']
const allTimeOrDateRangeSelection = ref(allTimeOrDateRange[0])

const groupBySelections = ['Day', 'Month', 'Year']
const groupBySelection = ref(groupBySelections[0])

export default {
    name: 'botStats',
    components: {
        chart
    },
    props: {
        botJson: Object
    },
    data() {
        return {
            botid: "",
            datePickerMin: new Date(0).toISOString().substring(0, 10),
            datePickerMax: new Date().toISOString().substring(0, 10),
            stats: [],
            commandStats:[],
            customStats: [],
            cards: [],
            showDateRange: false,
            startDate: null,
            endDate: Date.now(),
            groupByTimeFrame: 'd',
        }
    },
    async mounted() {
        this.botid = this.$route.params.id

        this.datePickerMin = new Date(this.$props.botJson.addedon).toISOString().substring(0, 10)

        // this.getData()
    },
    methods:{
        dateOrAllTimeChanged(event) {
            this.showDateRange = event === "Date Range"
            if (event === "All Time") {
                this.startDate = null
                this.endDate = null
            }
            this.getData()
        },
        updateStartDate(event) {
            this.startDate = new Date(event.target.value).getTime()
            this.getData()
        },
        updateEndDate(event) {
            this.endDate = new Date(event.target.value).getTime()
            this.getData()
        },
        formatDate(timeStamp) {
            const date = new Date(timeStamp)
            return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        },
        groupBySelectorChanged(event){
            this.groupByTimeFrame=event.target.value
            this.getData()
        },
        async getData() {
            const defaultStatsJson = await $fetch(`/api/bots/${this.botid}/stats?groupBy=1${this.groupByTimeFrame}${this.startDate && this.endDate ? `&start=${this.startDate}&end=${this.endDate}` : ''}`)

            this.stats = defaultStatsJson.mainStats.stats.map(t=>{
                t.data.labels = defaultStatsJson.mainStats.labels.map(d=>this.formatDate(d))
                switch(t.name){
                    case "CPU Usage":{
                        t.options = {
                            	scales: {
									y: {
										ticks: {
											callback: value => `${value}%` 
										},
										beginAtZero: true
									}
								},
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: context => `${context.dataset.label} ${context.parsed.y}%`
                                    }
                                }
                            }
                        }
                    }break;
                    case "Ram Usage":{
                        t.options={
                            scales: {
                                y: {
                                    ticks: {
                                        callback: value => this.bytesToSize(value) 
                                    }
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        // if (context.parsed.y !== null) {

                                        label: context => `${context.dataset.label}: ${this.bytesToSize(context.parsed.y)}`
                                    }
                                }
                            }
                        }
                    }break;
                }
                return t
            })

            this.commandStats = defaultStatsJson.commands.map(t=>{
                if (t.name==="Command usage over time") t.data.labels = t.labels.map(d=>this.formatDate(d))
                return t
            })
            this.customStats = defaultStatsJson.custom?.map(t=>{
                if (t.type === "line") t.data.labels = defaultStatsJson.mainStats.labels.map(d=>this.formatDate(d))
                return t
            })

            this.cards = defaultStatsJson.cards
        },
        getLastStat(mainStats, stat){
            const dataSet = mainStats[mainStats.findIndex(a=>a.name===stat)].data.datasets[0].data
            return dataSet[dataSet.length-1]
        },
        bytesToSize(bytes) {
            const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];
            const unit = Math.floor(Math.log(bytes) / Math.log(1024));
            return new Intl.NumberFormat("en", {style: "unit", unit: units[unit]}).format(bytes / 1024 ** unit);
        }
    }
}
</script>