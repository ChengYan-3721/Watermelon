import {_decorator, Component, Node, Prefab, instantiate, RigidBody2D, Collider2D, math, view, Vec2, Vec3, Label, AudioClip, AudioSource, UITransform, Animation} from 'cc';

const {ccclass, property} = _decorator;

// 返回设备独立像素
export const size: math.Size = view.getVisibleSizeInPixel();

export let isOver: boolean = false;
export let nodes: Set<Node>;
export let collides: number[] = [];

@ccclass('main')
export class main extends Component {
    @property(Node)
    scoreLabel: Node = null;
    @property([Prefab])
    fruits: Prefab[];
    @property(Node)
    over: Node = null;
    @property(Node)
    overLabel: Node = null;
    @property(Node)
    winNode: Node = null;
    @property(Node)
    topLine: Node = null;
    // 爆炸动画
    @property(Node)
    bomNode: Node = null;
    // 音效
    @property(AudioClip)
    audioClip: AudioClip;
    // 播放声音的组件
    sound: AudioSource;

    // 刚出生的水果
    newFruit: Node = null;

    isMove: boolean = true;

    touchPos: Vec2;

    score: number = 0;

    // 创建公共静态对象
    public static instance: main = null;

    start() {
        // 静态对象赋值为当前对象
        main.instance = this;
        this.touchPos = new Vec2();
        nodes = new Set();
        // collides = new Set();
        // 获取 AudioSource 组件
        this.sound = this.node.getComponent(AudioSource);
        this.play();
    }

    update(deltaTime: number) {
        this.topLine.active = !!nodes.size;
    }

    play() {
        isOver = false;
        this.over.active = false;
        this.topLine.active = false;
        nodes.clear();
        this.score = 0;
        this.scoreLabel.getComponent(Label).string = this.score.toString();
        this.yieldNewFruit();
        // 恢复接收输入事件
        this.node.resumeSystemEvents(true);
        // 计算设备像素和项目像素的比值（这里项目设置的是适配屏幕宽，所以计算x轴的比值）
        let x: number = 720 / size.x;
        // let y: number = size.y * x / 2;
        this.node.on(Node.EventType.TOUCH_END, (e) => {
            if(!this.isMove) return;
            this.isMove = false;
            this.scheduleOnce(()=>{
                this.isMove = true;
            }, 1);
            if(!this.newFruit.isValid  && !this.newFruit) this.scheduleOnce(this.yieldNewFruit, 1);
            let s = e.getLocationX() * x - 360
            this.newFruit.getComponent(RigidBody2D).gravityScale = 0;
            this.newFruit.getComponent(RigidBody2D).linearVelocity = this.touchPos.set(s / 6, 0);
            this.scheduleOnce(()=>{
                if(this.newFruit.isValid && this.newFruit) {
                    this.newFruit.getComponent(RigidBody2D).linearVelocity = this.touchPos.set(0, 0);
                    this.newFruit.setPosition(s, 560);
                    this.newFruit.getComponent(Collider2D).enabled = true;
                    this.newFruit.getComponent(RigidBody2D).gravityScale = 4;
                    this.newFruit = null;
                }else{
                    this.scheduleOnce(this.yieldNewFruit, 1);
                }
            }, 0.15);
            this.scheduleOnce(this.yieldNewFruit, 1);
        })
    }

    // 产生新水果
    yieldNewFruit() {
        if(this.newFruit) return;
        let i = Math.floor(Math.random() * 5);
        this.newFruit = instantiate(this.fruits[i]);
        this.newFruit.setParent(this.node);
        this.newFruit.setPosition(0, 560);
        this.newFruit.getComponent(Collider2D).enabled = false;
        this.newFruit.getComponent(RigidBody2D).sleep();
    }

    // 合并同类项，生成下一等级的水果
    async mergeFruits(pos: Vec3, level: number) {
        // let x: number = 720 / size.x;
        // let y: number = 1280 / x / size.y;
        await new Promise(resolve=>setTimeout(resolve, 100));
        let mergeFruit: Node = instantiate(this.fruits[level]);
        mergeFruit.setParent(this.node);
        // mergeFruit.setPosition(pos.x - 360, pos.y - 640 / y);
        mergeFruit.setPosition(pos.x, pos.y);
        // 更新分数
        this.scoreLabel.getComponent(Label).string = this.score.toString();
        // 播放音效
        this.sound.playOneShot(this.audioClip, 1);
        // 播放动画
        // this.anim(pos.x - 360, pos.y - 640 / y, mergeFruit.getComponent(UITransform).contentSize);
        this.anim(pos.x, pos.y, mergeFruit.getComponent(UITransform).contentSize);
        if(level == 10) this.winNode.active = true;
    }

    async gameOver(){
        isOver = true;
        this.node.pauseSystemEvents(true);
        let fruits = this.node.children;
        for (let i = fruits.length - 1; i > 3; i--) {
            if(!fruits[i] || fruits[i].name.indexOf('fruit')) continue;
            // 播放音效
            this.sound.playOneShot(this.audioClip, 1);
            fruits[i].destroy();
            await new Promise(resolve=>setTimeout(resolve, 100));
        }
        this.over.active = true;
        this.overLabel.getComponent(Label).string = this.score.toString();
        if(this.newFruit) this.newFruit.destroy();
        this.newFruit = null;
    }

    restart(){
        let fruits = this.node.children;
        for (let i = fruits.length - 1; i > 4; i--) {
            if(fruits[i].name.indexOf('fruit')) continue;
            fruits[i].destroy();
        }
        this.scheduleOnce(() => {
            if(this.newFruit) this.newFruit.destroy();
            this.newFruit = null;
            this.play();
        }, 0)
    }

    win(){
        this.winNode.active = false;
    }

    anim(x1 :number, y1: number, box){
        this.bomNode.setPosition(x1, y1);
        this.bomNode.getComponent(UITransform).setContentSize(box.x, box.y);
        this.bomNode.setSiblingIndex(666);
        this.bomNode.getComponent(Animation).play('bom');
        this.scheduleOnce(() => {this.bomNode.setPosition(0, 1500);}, 0.2)
    }
}

