declare module 'animejs' {
    namespace anime {
        interface AnimeParams {
            targets: any;
            duration?: number;
            delay?: number | Function;
            endDelay?: number;
            easing?: string | Function;
            round?: number | boolean;
            direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
            loop?: number | boolean;
            autoplay?: boolean;
            [prop: string]: any;
            begin?: Function;
            complete?: Function;
            update?: Function;
        }

        interface AnimeInstance {
            play(): AnimeInstance;
            pause(): AnimeInstance;
            restart(): AnimeInstance;
            reverse(): AnimeInstance;
            seek(time: number): AnimeInstance;
            [prop: string]: any;
        }

        interface AnimeTimelineInstance extends AnimeInstance {
            add(params: AnimeParams, timeOffset?: string | number): AnimeTimelineInstance;
        }

        interface AnimeStatic {
            (params: AnimeParams): AnimeInstance;
            timeline(params?: AnimeParams): AnimeTimelineInstance;
            random(min: number, max: number): number;
            stagger(value: number | string, options?: any): Function;
            [prop: string]: any;
        }
    }

    const anime: anime.AnimeStatic;
    export default anime;
} 