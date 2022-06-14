import {_decorator, Component, Contact2DType, Collider2D, IPhysics2DContact, CCInteger} from 'cc';
import {main} from 'db://assets/scripts/main';

const {ccclass, property} = _decorator;

@ccclass('Fruit')
export class Fruit extends Component {
    @property(CCInteger)
    level: number = 0;

    nowTime: number = Date.now();
    isShow: boolean = false;

    start() {
        // 获取任意类型的碰撞器实例，可以使用基类
        const collider = this.node.getComponent(Collider2D);
        // 注册单个碰撞体的回调函数
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (selfCollider.tag === otherCollider.tag && selfCollider.tag !== 11) {
            // 碰撞后刚体属性改为false
            selfCollider.enabled = false;
            const points = contact.getWorldManifold().points;
            this.scheduleOnce(()=>{
                this.node.destroy();
                main.instance.mergeFruits(points[0], this.level + 1);
                main.instance.score += (this.level + 1) * 5;
            }, 0);
            return;
        }
        if (otherCollider.tag === 14){
            this.schedule(this.gameOver, 3)
            return;
        }
        if(otherCollider.tag === 99){
            this.nowTime = Date.now();
            this.scheduleOnce(this.showTopLine, 1)
        }
    }

    onEndContact (selfCollider: Collider2D, otherCollider: Collider2D) {
        if (otherCollider.tag === 14){
            this.unschedule(this.gameOver);
            return;
        }
        if(Date.now() - this.nowTime < 888 && otherCollider.tag === 99){
            this.unschedule(this.showTopLine);
        }
        if(this.isShow && otherCollider.tag === 99){
            this.scheduleOnce(this.hideTopLine, 0);
        }
    }

    update(deltaTime: number) {
    }

    // 必须单独拿出来，定时器里不能直接调用其它对象的方法
    gameOver(){
        main.instance.gameOver();
    }

    showTopLine(){
        main.instance.topLine.active = true;
        this.isShow = true;
    }

    hideTopLine(){
        main.instance.topLine.active = false;
    }
}

