import * as React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  PanResponderInstance,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Animated,
  NativeTouchEvent
} from 'react-native';

export interface ZoomViewProps {
  data: { uri: string; id: number; };
  swipeTo: ( index: number ) => void;
  curIndex: number;
}

export interface ZoomViewState {
  zoomLevel: number;
  center: { rcx: number; rcy: number; };
  status: ZoomViewStatus;
  scale: Animated.Value;
}

/**
 * Constants
 */
const PINCH_DELAY = 300;
const DOUBLE_TAP_DELAY = 300;
const MOVEMENT_THRESHOLD = 5;
const ZOOM_SENSITIVITY = 150;
const MAX_ZOOM_LEVEL = 3;
const TAP_ZOOM_LEVEL = 1.3;
const MOVEMENT_SENSITIVITY = 0.3;

enum ZoomViewStatus {
  NORMAL = "ZoomViewStatus/NORMAL",
  ZOOM = "ZoomViewStatus/ZOOM"
}

export default class ZoomViewComponent extends React.Component<ZoomViewProps, ZoomViewState> {
  gestureHandlers: PanResponderInstance;
  viewport: { width: number; height: number };
  timestamp: number;
  pinchCenter: {
    zoomLevel: number;
    rcx: number;
    rcy: number;
    timestamp: number;
    touches: NativeTouchEvent[];
  }

  constructor ( props: ZoomViewProps ) {
    super( props );
    this.viewport = Dimensions.get( 'window' );
    this.state = {
      zoomLevel: 1,
      center: { rcx: 0.5, rcy: 0.5 },
      scale: new Animated.Value( 1 ),
      status: ZoomViewStatus.NORMAL,
    };
    this.timestamp = new Date().getTime();
    this.pinchCenter = {
      zoomLevel: 1,
      rcx: 0.5,
      rcy: 0.5,
      timestamp: new Date().getTime(),
      touches: []
    };

    this.gestureHandlers = PanResponder.create( {
      onStartShouldSetPanResponder: ( e, gestureState ) => this._onStartShouldSetPanResponder( e, gestureState ),
      onMoveShouldSetPanResponder: ( e, gestureState ) => this._onMoveShouldSetPanResponder( e, gestureState ),
      onPanResponderGrant: ( e, gestureState ) => this._onPanResponderGrant( e, gestureState ),
      onPanResponderMove: ( e, gestureState ) => this._onPanResponderMove( e, gestureState ),
      onPanResponderRelease: ( e, gestureState ) => this._onPanResponderRelease( e, gestureState ),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false
    } )
  }

  private _isDoubleTap ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const now = new Date().getTime();
    // NOTE : double tap condition == now - this.timestamp < tapDelay
    if ( e.timeStamp - this.timestamp < DOUBLE_TAP_DELAY )
      // fire double tap event
      this._onDoubleTap( e, gestureState );
    else this.timestamp = e.timeStamp;
  }

  private _onDoubleTap ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { pageX, pageY } = e.nativeEvent;
    const { status } = this.state;
    const { width, height } = this.viewport;

    switch ( status ) {
      case ZoomViewStatus.NORMAL: {
        const newRcx = pageX / width;
        const newRcy = pageY / height;
        this._setZoomState( newRcx, newRcy, TAP_ZOOM_LEVEL );
        break;
      }
      case ZoomViewStatus.ZOOM:
        // reset
        this._setZoomState( 0.5, 0.5, 1 );
        break;
    }
  }

  private _onStartShouldSetPanResponder ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    this._isDoubleTap( e, gestureState );
    return true;
  }

  private _onMoveShouldSetPanResponder ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { dx, dy, numberActiveTouches } = gestureState;
    return Math.abs( dx ) > MOVEMENT_THRESHOLD ||
      Math.abs( dy ) > MOVEMENT_THRESHOLD ||
      numberActiveTouches === 2;
  }

  private _onPanResponderGrant ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {

  }

  private _onPanResponderMove ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { numberActiveTouches, dx } = gestureState;
    const { status } = this.state;
    const { swipeTo, curIndex } = this.props;
    const now = new Date().getTime();

    switch ( status ) {
      case ZoomViewStatus.NORMAL: {
        // trigger swipe action
        if ( numberActiveTouches === 1 && now - this.pinchCenter.timestamp > PINCH_DELAY ) {
          if ( dx > 0 ) swipeTo( curIndex - 1 );
          else if ( dx < 0 ) swipeTo( curIndex + 1 );
        }
        // trigger zoom action
        else if ( numberActiveTouches === 2 )
          this._onPinch( e, gestureState );
        break;
      }
      case ZoomViewStatus.ZOOM: {
        /// trigger move in zoom mode
        if ( numberActiveTouches === 1 ) {
          this._onMove( e, gestureState );
        }
        // trigger zoom action
        else if ( numberActiveTouches === 2 )
          this._onPinch( e, gestureState );
        break;
      }
    }
  }

  private _onPanResponderRelease ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    // this._onPanResponderMove( e, gestureState );
    // TODO : stick image component
    const { numberActiveTouches, dx } = gestureState;
    const { status } = this.state;
    const { swipeTo, curIndex } = this.props;

    switch ( status ) {
      case ZoomViewStatus.NORMAL: {
        // trigger swipe action
        if ( numberActiveTouches === 1 ) {
          console.log( 'hi??' );
          // if ( dx > 0 ) swipeTo( curIndex - 1 );
          // else if ( dx < 0 ) swipeTo( curIndex + 1 );
        }
        else if ( numberActiveTouches === 2 ) {
          // initialize pinch timestamp
          this.pinchCenter.timestamp = 0;
          console.log( 'pinch released' );
          break;
        }
      }
      default:
        break;
    }
  }

  private _getDistance ( touches: NativeTouchEvent[] ) {
    const dx = Math.abs( touches[ 0 ].pageX - touches[ 1 ].pageX );
    const dy = Math.abs( touches[ 0 ].pageY - touches[ 1 ].pageY );
    return Math.sqrt( dx * dx + dy * dy );
  }

  private _adjustBorder ( rc: number, zl: number ) {
    if ( rc < 1 / ( 2 * zl ) ) rc = 1 / ( 2 * zl );
    // right x border
    else if ( rc > ( 1 - 1 / ( 2 * zl ) ) ) rc = ( 1 - 1 / ( 2 * zl ) );
    return rc;
  }

  private _onMove ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { numberActiveTouches } = gestureState;

    if ( numberActiveTouches === 1 ) {
      const { dx, dy } = gestureState;
      const { width, height } = this.viewport;
      const { zoomLevel, center } = this.state;
      const { rcx, rcy } = center;
      const newRcx = - dx * MOVEMENT_SENSITIVITY / ( width * zoomLevel ) + rcx;
      const newRcy = - dy * MOVEMENT_SENSITIVITY / ( height * zoomLevel ) + rcy;
      this._setZoomState( newRcx, newRcy, zoomLevel );
    }
  }

  private _onPinch ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { numberActiveTouches } = gestureState;
    const { touches } = e.nativeEvent;
    const { zoomLevel } = this.state;
    const { width, height } = this.viewport;
    const { rcx, rcy } = this.pinchCenter;

    if ( numberActiveTouches === 2 ) {
      const now = new Date().getTime();

      if ( now - this.pinchCenter.timestamp > PINCH_DELAY ) {
        const cx = ( touches[ 0 ].pageX + touches[ 1 ].pageX ) / 2;
        const cy = ( touches[ 0 ].pageY + touches[ 1 ].pageY ) / 2;
        const newRcx = rcx - 1 / ( 2 * zoomLevel ) + cx / ( width * zoomLevel );
        const newRcy = rcy - 1 / ( 2 * zoomLevel ) + cy / ( height * zoomLevel );
        console.log( 'zoom prev center', rcx, rcy )
        console.log( 'zoom new center', newRcx, newRcy );

        this.pinchCenter = {
          zoomLevel,
          rcx: newRcx,
          rcy: newRcy,
          timestamp: now,
          touches
        };
        return;
      }

      // calculate new zoom level
      const baseDistance = this._getDistance( this.pinchCenter.touches ) * zoomLevel;
      const distance = this._getDistance( touches ) * zoomLevel;
      const distanceRatio = ( distance + ZOOM_SENSITIVITY ) / ( baseDistance + ZOOM_SENSITIVITY );
      let newZoomLevel = distanceRatio * zoomLevel;
      newZoomLevel = newZoomLevel >= MAX_ZOOM_LEVEL ? MAX_ZOOM_LEVEL : newZoomLevel;
      newZoomLevel = newZoomLevel < 1 ? 1 : newZoomLevel;

      // update pinchCenter's timestamp
      this.pinchCenter.timestamp = now;

      // set zoom state
      this._setZoomState( rcx, rcy, newZoomLevel );
    }
  }

  private _setZoomState ( rcx: number, rcy: number, zl: number ) {
    const { width, height } = this.viewport;

    rcx = this._adjustBorder( rcx, zl );
    rcy = this._adjustBorder( rcy, zl );

    this.pinchCenter = {
      ...this.pinchCenter,
      rcx, rcy
    };

    Animated.timing( this.state.scale, {
      duration: 300,
      toValue: zl,
      delay: 0,
      useNativeDriver: true
    } ).start();

    this.setState( {
      zoomLevel: zl,
      center: { rcx, rcy },
      status: zl === 1 ? ZoomViewStatus.NORMAL : ZoomViewStatus.ZOOM
    } )
  }

  public render () {
    const { zoomLevel, center, scale } = this.state;
    const { width, height } = this.viewport;
    const { rcx, rcy } = center;

    const { data } = this.props;
    const transformStyle = {
      transform: [
        { scale },
        // { scale: zoomLevel },
        { translateX: ( 0.5 - rcx ) * width },
        { translateY: ( 0.5 - rcy ) * height },
        // for android
        { perspective: 1000 } ]
    };

    return (
      <Animated.View
        style={ [ { ...styles.container, ...this.viewport }, transformStyle ] }
        { ...this.gestureHandlers.panHandlers }>
        <Image
          source={ data }
          style={ styles.image }
          resizeMode="contain" />
      </Animated.View>
    );
  }
}

/**
 * Styles
 */

const styles = StyleSheet.create( {
  container: {
    flex: 1
  },
  image: {
    flex: 1,
    width: undefined,
    height: undefined
  }
} );